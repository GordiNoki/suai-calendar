export interface SuaiFullRasp {
    info: Info;
    filter: Filter;
    days: Day[];
    regPreps: Reg;
    regGroups: Reg;
    regChairs: Reg;
    regRooms: Reg;
}

interface Day {
    day: number;
    title: string;
    lessons: Lesson[];
}

interface Lesson {
    less: number;
    begin: string;
    end: string;
    weekAll?: Week[];
    week1?: Week[];
    week2?: Week[];
}

interface Week {
    id: number;
    subgId: string;
    week?: number;
    type: string;
    dics: string;
    chairId: number;
    groupsAisIds: number[];
    prepsAisIds: number[];
    roomsIds: number[];
}

interface Filter {
    text: string;
    prepAisId: number;
    groupAisId: number;
    chairId: number;
    roomId: number;
}

interface Info {
    years: string;
    isAutumn: boolean;
    dateRelease: Date;
    currentWeek: number;
    isWeekOdd: boolean;
    currentDay: number;
    currentLess: number;
    pastLess: number;
    upcomingLess: number;
    time: string;
}

interface Reg {
    selected?: RegSel;
    options: RegSel[];
}

interface RegSel {
    value: string;
    inner: string;
    isSelected?: boolean;
    level?: number;
}
