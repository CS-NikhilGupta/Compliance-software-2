import { Compliance, Periodicity } from '@prisma/client';
import { logger } from '@/utils/logger';

interface IndianHoliday {
  date: Date;
  name: string;
  isNational: boolean;
}

export class DueDateCalculator {
  private indianHolidays: Map<string, IndianHoliday[]> = new Map();

  constructor() {
    this.initializeHolidays();
  }

  /**
   * Calculate due dates for a compliance based on its periodicity and rules
   */
  calculateDueDates(compliance: Compliance, year: number): Date[] {
    const dueDates: Date[] = [];

    try {
      switch (compliance.periodicity) {
        case 'MONTHLY':
          dueDates.push(...this.calculateMonthlyDueDates(compliance, year));
          break;
        case 'QUARTERLY':
          dueDates.push(...this.calculateQuarterlyDueDates(compliance, year));
          break;
        case 'HALF_YEARLY':
          dueDates.push(...this.calculateHalfYearlyDueDates(compliance, year));
          break;
        case 'YEARLY':
          dueDates.push(...this.calculateYearlyDueDates(compliance, year));
          break;
        case 'WEEKLY':
          dueDates.push(...this.calculateWeeklyDueDates(compliance, year));
          break;
        case 'DAILY':
          dueDates.push(...this.calculateDailyDueDates(compliance, year));
          break;
        case 'ONE_TIME':
          dueDates.push(...this.calculateOneTimeDueDates(compliance, year));
          break;
        case 'EVENT_BASED':
          // Event-based compliances need manual triggering
          break;
        default:
          logger.warn({ complianceId: compliance.id, periodicity: compliance.periodicity }, 'Unknown periodicity');
      }

      // Adjust for holidays and weekends
      return dueDates.map(date => this.adjustForHolidaysAndWeekends(date));
    } catch (error) {
      logger.error({ 
        complianceId: compliance.id, 
        year, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }, 'Error calculating due dates');
      return [];
    }
  }

  private calculateMonthlyDueDates(compliance: Compliance, year: number): Date[] {
    const dueDates: Date[] = [];
    const dueDay = this.extractDueDayFromRules(compliance.dueDateRules) || 15;

    for (let month = 0; month < 12; month++) {
      const dueDate = new Date(year, month, dueDay);
      
      // Adjust if the day doesn't exist in the month (e.g., Feb 30)
      if (dueDate.getMonth() !== month) {
        dueDate.setDate(0); // Set to last day of previous month
      }
      
      dueDates.push(dueDate);
    }

    return dueDates;
  }

  private calculateQuarterlyDueDates(compliance: Compliance, year: number): Date[] {
    const dueDates: Date[] = [];
    const dueDay = this.extractDueDayFromRules(compliance.dueDateRules) || 15;
    
    // Q1: Jan-Mar (due in Apr), Q2: Apr-Jun (due in Jul), Q3: Jul-Sep (due in Oct), Q4: Oct-Dec (due in Jan+1)
    const quarterEndMonths = [3, 6, 9, 0]; // April, July, October, January (next year)
    
    quarterEndMonths.forEach((month, index) => {
      const dueYear = month === 0 ? year + 1 : year;
      const dueDate = new Date(dueYear, month, dueDay);
      dueDates.push(dueDate);
    });

    return dueDates;
  }

  private calculateHalfYearlyDueDates(compliance: Compliance, year: number): Date[] {
    const dueDates: Date[] = [];
    const dueDay = this.extractDueDayFromRules(compliance.dueDateRules) || 15;
    
    // H1: Apr-Sep (due in Oct), H2: Oct-Mar (due in Apr+1)
    dueDates.push(new Date(year, 9, dueDay)); // October
    dueDates.push(new Date(year + 1, 3, dueDay)); // April next year

    return dueDates;
  }

  private calculateYearlyDueDates(compliance: Compliance, year: number): Date[] {
    const dueDay = this.extractDueDayFromRules(compliance.dueDateRules) || 15;
    const dueMonth = this.extractDueMonthFromRules(compliance.dueDateRules) || 3; // Default to April
    
    return [new Date(year, dueMonth, dueDay)];
  }

  private calculateWeeklyDueDates(compliance: Compliance, year: number): Date[] {
    const dueDates: Date[] = [];
    const dayOfWeek = this.extractDayOfWeekFromRules(compliance.dueDateRules) || 1; // Default to Monday
    
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    
    // Find first occurrence of the day in the year
    let currentDate = new Date(startDate);
    while (currentDate.getDay() !== dayOfWeek) {
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Add all occurrences of that day in the year
    while (currentDate <= endDate) {
      dueDates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 7);
    }
    
    return dueDates;
  }

  private calculateDailyDueDates(compliance: Compliance, year: number): Date[] {
    const dueDates: Date[] = [];
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    
    // For daily compliances, we'll create tasks for business days only
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      // Skip weekends
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
        dueDates.push(new Date(currentDate));
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dueDates;
  }

  private calculateOneTimeDueDates(compliance: Compliance, year: number): Date[] {
    const specificDate = this.extractSpecificDateFromRules(compliance.dueDateRules);
    if (specificDate && specificDate.getFullYear() === year) {
      return [specificDate];
    }
    return [];
  }

  private adjustForHolidaysAndWeekends(date: Date): Date {
    let adjustedDate = new Date(date);
    
    // Move to next business day if it falls on weekend
    while (adjustedDate.getDay() === 0 || adjustedDate.getDay() === 6) {
      adjustedDate.setDate(adjustedDate.getDate() + 1);
    }
    
    // Check for Indian holidays
    const yearKey = adjustedDate.getFullYear().toString();
    const holidays = this.indianHolidays.get(yearKey) || [];
    
    const isHoliday = holidays.some(holiday => 
      holiday.date.toDateString() === adjustedDate.toDateString()
    );
    
    if (isHoliday) {
      // Move to next business day
      do {
        adjustedDate.setDate(adjustedDate.getDate() + 1);
      } while (
        adjustedDate.getDay() === 0 || 
        adjustedDate.getDay() === 6 || 
        holidays.some(h => h.date.toDateString() === adjustedDate.toDateString())
      );
    }
    
    return adjustedDate;
  }

  private extractDueDayFromRules(rules: any): number | null {
    if (!rules || typeof rules !== 'object') return null;
    return rules.dueDay || null;
  }

  private extractDueMonthFromRules(rules: any): number | null {
    if (!rules || typeof rules !== 'object') return null;
    return rules.dueMonth || null;
  }

  private extractDayOfWeekFromRules(rules: any): number | null {
    if (!rules || typeof rules !== 'object') return null;
    return rules.dayOfWeek || null;
  }

  private extractSpecificDateFromRules(rules: any): Date | null {
    if (!rules || typeof rules !== 'object') return null;
    if (rules.specificDate) {
      return new Date(rules.specificDate);
    }
    return null;
  }

  private initializeHolidays(): void {
    // Initialize with common Indian holidays for current and next year
    const currentYear = new Date().getFullYear();
    
    for (let year = currentYear; year <= currentYear + 2; year++) {
      const holidays: IndianHoliday[] = [
        // Fixed date holidays
        { date: new Date(year, 0, 26), name: 'Republic Day', isNational: true },
        { date: new Date(year, 7, 15), name: 'Independence Day', isNational: true },
        { date: new Date(year, 9, 2), name: 'Gandhi Jayanti', isNational: true },
        
        // Common regional holidays (approximate dates - these vary by lunar calendar)
        { date: new Date(year, 2, 8), name: 'Holi', isNational: false },
        { date: new Date(year, 3, 14), name: 'Ram Navami', isNational: false },
        { date: new Date(year, 7, 19), name: 'Janmashtami', isNational: false },
        { date: new Date(year, 9, 24), name: 'Dussehra', isNational: false },
        { date: new Date(year, 10, 12), name: 'Diwali', isNational: false },
        
        // Christmas
        { date: new Date(year, 11, 25), name: 'Christmas', isNational: true },
      ];
      
      this.indianHolidays.set(year.toString(), holidays);
    }
  }

  /**
   * Get holidays for a specific year
   */
  getHolidays(year: number): IndianHoliday[] {
    return this.indianHolidays.get(year.toString()) || [];
  }

  /**
   * Check if a date is a holiday
   */
  isHoliday(date: Date): boolean {
    const yearKey = date.getFullYear().toString();
    const holidays = this.indianHolidays.get(yearKey) || [];
    
    return holidays.some(holiday => 
      holiday.date.toDateString() === date.toDateString()
    );
  }

  /**
   * Get next business day from a given date
   */
  getNextBusinessDay(date: Date): Date {
    return this.adjustForHolidaysAndWeekends(date);
  }
}
