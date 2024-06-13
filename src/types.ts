export interface ResponseData {
    data: TimeRange[];
    end: string;
    start: string;
    cumulative_total: CumulativeTotal;
    daily_average: DailyAverage;
}

interface DailyAverage {
    days_including_holidays: number;
    days_minus_holidays: number;
    holidays: number;
    seconds: number;
    seconds_including_other_language: number;
    text: string;
    text_including_other_language: string;
}

interface CumulativeTotal {
    decimal: string;
    digital: string;
    seconds: number;
    text: string;
}

interface TimeRange {
    categories: Time[];
    dependencies: any[];
    editors: Time[];
    languages: Time[];
    machines: Time[];
    operating_systems: Time[];
    projects: Time[];
    grand_total: GrandTotal;
    range: Range;
}

interface Range {
    date: string;
    end: string;
    start: string;
    text: string;
    timezone: string;
}

interface GrandTotal {
    digital: string;
    hours: number;
    minutes: number;
    text: string;
    total_seconds: number;
}

interface Time {
    digital: string;
    hours: number;
    minutes: number;
    name: string;
    percent: number;
    seconds: number;
    text: string;
    total_seconds: number;
}