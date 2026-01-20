import { NextResponse } from 'next/server';
import KoreanLunarCalendar from 'korean-lunar-calendar';

interface Holiday {
  date: string;
  name: string;
  isSubstitute?: boolean;
}

// 고정 공휴일 (양력)
const FIXED_HOLIDAYS: Array<{ month: number; day: number; name: string }> = [
  { month: 1, day: 1, name: '신정' },
  { month: 3, day: 1, name: '삼일절' },
  { month: 5, day: 5, name: '어린이날' },
  { month: 6, day: 6, name: '현충일' },
  { month: 8, day: 15, name: '광복절' },
  { month: 10, day: 3, name: '개천절' },
  { month: 10, day: 9, name: '한글날' },
  { month: 12, day: 25, name: '크리스마스' },
];

// 음력 공휴일
const LUNAR_HOLIDAYS: Array<{ month: number; day: number; name: string; days?: number[] }> = [
  { month: 1, day: 1, name: '설날', days: [-1, 0, 1] }, // 설 전날, 설날, 설 다음날
  { month: 4, day: 8, name: '부처님오신날' },
  { month: 8, day: 15, name: '추석', days: [-1, 0, 1] }, // 추석 전날, 추석, 추석 다음날
];

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr + 'T00:00:00');
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

function getDayOfWeek(dateStr: string): number {
  return new Date(dateStr + 'T00:00:00').getDay();
}

// 대체공휴일 계산 (일요일과 겹치는 경우)
function getSubstituteHoliday(dateStr: string, name: string, existingDates: Set<string>): Holiday | null {
  const dayOfWeek = getDayOfWeek(dateStr);

  // 일요일인 경우 대체공휴일
  if (dayOfWeek === 0) {
    let substitute = addDays(dateStr, 1);
    // 이미 공휴일이면 다음 날로
    while (existingDates.has(substitute)) {
      substitute = addDays(substitute, 1);
    }
    return { date: substitute, name: `대체공휴일 (${name})`, isSubstitute: true };
  }

  return null;
}

function getKoreanHolidays(year: number): Holiday[] {
  const holidays: Holiday[] = [];
  const holidayDates = new Set<string>();
  const calendar = new KoreanLunarCalendar();

  // 1. 고정 공휴일 추가
  for (const holiday of FIXED_HOLIDAYS) {
    const dateStr = formatDate(year, holiday.month, holiday.day);
    holidays.push({ date: dateStr, name: holiday.name });
    holidayDates.add(dateStr);
  }

  // 2. 음력 공휴일 추가
  for (const holiday of LUNAR_HOLIDAYS) {
    const days = holiday.days || [0];

    for (const dayOffset of days) {
      try {
        // 음력 날짜 설정
        const lunarMonth = holiday.month;
        const lunarDay = holiday.day + dayOffset;

        // 음력 -> 양력 변환
        calendar.setLunarDate(year, lunarMonth, lunarDay, false);
        const solarYear = calendar.getSolarYear();
        const solarMonth = calendar.getSolarMonth();
        const solarDay = calendar.getSolarDay();

        const dateStr = formatDate(solarYear, solarMonth, solarDay);
        const displayName = dayOffset === 0 ? holiday.name :
                          dayOffset < 0 ? `${holiday.name} 전날` : `${holiday.name} 다음날`;

        holidays.push({ date: dateStr, name: displayName });
        holidayDates.add(dateStr);
      } catch (e) {
        // 음력 변환 실패 시 스킵
        console.error(`Failed to convert lunar date: ${holiday.name}`, e);
      }
    }
  }

  // 3. 대체공휴일 계산 (어린이날, 설날, 추석에 적용)
  const substituteTargets = ['어린이날', '설날', '추석'];
  const additionalHolidays: Holiday[] = [];

  for (const holiday of holidays) {
    if (substituteTargets.some(target => holiday.name.includes(target)) && !holiday.isSubstitute) {
      const substitute = getSubstituteHoliday(holiday.date, holiday.name, holidayDates);
      if (substitute) {
        additionalHolidays.push(substitute);
        holidayDates.add(substitute.date);
      }
    }
  }

  holidays.push(...additionalHolidays);

  // 날짜순 정렬
  holidays.sort((a, b) => a.date.localeCompare(b.date));

  return holidays;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get('year');
    const year = yearParam ? parseInt(yearParam) : new Date().getFullYear();

    if (isNaN(year) || year < 1900 || year > 2100) {
      return NextResponse.json({ error: 'Invalid year' }, { status: 400 });
    }

    const holidays = getKoreanHolidays(year);

    return NextResponse.json({ year, holidays });
  } catch (error) {
    console.error('Failed to get holidays:', error);
    return NextResponse.json({ error: 'Failed to get holidays' }, { status: 500 });
  }
}
