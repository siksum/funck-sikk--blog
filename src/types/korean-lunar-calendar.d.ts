declare module 'korean-lunar-calendar' {
  class KoreanLunarCalendar {
    constructor();
    setLunarDate(year: number, month: number, day: number, isLeapMonth: boolean): void;
    setSolarDate(year: number, month: number, day: number): void;
    getLunarYear(): number;
    getLunarMonth(): number;
    getLunarDay(): number;
    getSolarYear(): number;
    getSolarMonth(): number;
    getSolarDay(): number;
    isLeapMonth(): boolean;
  }
  export = KoreanLunarCalendar;
}
