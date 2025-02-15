import ical, { ICalEventRepeatingFreq } from "ical-generator";
import moment from "moment";
import { SuaiGroup } from "./types/SuaiGroup";
import { SuaiFullRasp } from "./types/SuaiFullRasp";

const timeMap: Record<number, { h: number; m: number }> = {
    1: { h: 9, m: 30 },
    2: { h: 11, m: 10 },
    3: { h: 13, m: 0 },
    4: { h: 15, m: 0 },
    5: { h: 16, m: 40 },
    6: { h: 18, m: 30 },
};

export async function handler(event: any, _ctx: any) {
    const inputGroup = event.queryStringParameters.group;
    if (!inputGroup) return { statusCode: 400, body: "Group is not provided" };

    const calendar = ical();
    calendar.timezone("Europe/Moscow");

    const groups: SuaiGroup[] = await fetch(
        "https://api.guap.ru/rasp/v1/get-groups"
    ).then((r) => r.json());
    const groupId = groups.find((group) => group.title === inputGroup)?.aisId;

    if (!groupId) {
        return { statusCode: 404, body: "Group not found" };
    }

    const rasp: SuaiFullRasp = await fetch(
        "https://api.guap.ru/rasp/v1/get-rasp-full?groupAisId=" + groupId
    ).then((r) => r.json());

    if (!rasp || rasp.regGroups.selected?.inner !== inputGroup) {
        console.log(
            JSON.stringify({ msg: "Bad schedule API response", data: rasp })
        );
        return { statusCode: 404, body: "Buh" };
    }

    const roomMap = new Map();
    for (const room of rasp.regRooms.options) {
        roomMap.set(Number(room.value), room.inner);
    }

    const startDay = moment({
        month: 8,
        day: 1,
        year: Number(rasp.info.years.slice(0, 4)),
    });
    const startWeekDay = startDay.weekday();
    const endDay = moment({
        month: 4,
        year: Number(rasp.info.years.slice(0, 4)),
    })
        .add(1, "year")
        .endOf("month");

    for (const day of rasp.days.filter((day) => !!day.day)) {
        if (!day.day) continue;
        for (const lesson of day.lessons) {
            const dayTime = startDay
                .clone()
                .day(day.day)
                .add(timeMap[lesson.less]);

            if (startWeekDay > day.day) {
                dayTime.add(1, "week");
            }

            for (const weekLesson of [
                ...(lesson.week1 ?? []),
                ...(lesson.week2 ?? []),
                ...(lesson.weekAll ?? []),
            ]) {
                const lessonTime = dayTime.clone();
                if (weekLesson.week && weekLesson.week == 2) {
                    lessonTime.add(1, "week");
                }

                const rooms = weekLesson.roomsIds
                    .map((id) => roomMap.get(id)?.replaceAll("&nbsp;", " "))
                    .join("\n");

                calendar.createEvent({
                    start: lessonTime.toDate(),
                    end: lessonTime.add(90, "minutes").toDate(),
                    repeating: {
                        freq: ICalEventRepeatingFreq.WEEKLY,
                        interval: weekLesson.week ? 2 : 1,
                        until: endDay.toDate(),
                    },
                    summary: `${lesson.less}. ${weekLesson.dics} - ${weekLesson.type}`,
                    description: rooms,
                });
            }
        }
    }

    return {
        statusCode: 200,
        body: calendar.toString(),
        headers: {
            "Content-Type": "text/calendar; charset=utf-8",
        },
    };
}
