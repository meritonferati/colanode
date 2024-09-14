import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

export const hashCode = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const character = str.charCodeAt(i);
    hash = (hash << 5) - hash + character;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

export const updateScrollView = (container: HTMLElement, item: HTMLElement) => {
  const containerHeight = container.offsetHeight;
  const itemHeight = item ? item.offsetHeight : 0;

  const top = item.offsetTop;
  const bottom = top + itemHeight;

  if (top < container.scrollTop) {
    container.scrollTop -= container.scrollTop - top + 5;
  } else if (bottom > containerHeight + container.scrollTop) {
    container.scrollTop += bottom - containerHeight - container.scrollTop + 5;
  }
};

export const timeAgo = (dateParam: Date | string) => {
  if (dateParam == null) {
    return 'N/A';
  }

  let date = dateParam;
  if (typeof date === 'string') {
    date = new Date(date);
  }

  const diff = Number(new Date()) - date.getTime();
  const minute = 60 * 1000;
  const hour = minute * 60;
  const day = hour * 24;
  const month = day * 30;
  const year = day * 365;
  switch (true) {
    case diff < minute: {
      const seconds = Math.round(diff / 1000);
      return seconds < 5 ? 'Now' : `${seconds} seconds ago`;
    }
    case diff < hour: {
      const minutes = Math.round(diff / minute);
      return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
    }
    case diff < day: {
      const hours = Math.round(diff / hour);
      return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
    }
    case diff < month: {
      const days = Math.round(diff / day);
      return days === 1 ? '1 day ago' : `${days} days ago`;
    }
    case diff < year: {
      const months = Math.round(diff / month);
      return months === 1 ? '1 month ago' : `${months} months ago`;
    }
    case diff > year: {
      const years = Math.round(diff / year);
      return years === 1 ? '1 year ago' : `${years} years ago`;
    }
    default:
      return '';
  }
};

export const formatDate = (dateParam: Date | string | undefined): string => {
  if (dateParam == null) {
    return 'N/A';
  }

  const date = typeof dateParam === 'string' ? new Date(dateParam) : dateParam;

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const day = date.getDate();
  const monthIndex = date.getMonth();
  const year = date.getFullYear();
  const hour = date.getHours().toString().padStart(2, '0');
  const minute = date.getMinutes().toString().padStart(2, '0');

  return `${monthNames[monthIndex]} ${day}, ${year} at ${hour}:${minute}`;
};

export const compareString = (a?: string | null, b?: string | null): number => {
  if (a === b) {
    return 0;
  }

  if (a === undefined || a === null) {
    return -1;
  }

  if (b === undefined || b === null) {
    return 1;
  }

  if (a > b) {
    return 1;
  }

  return -1;
};

export const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch (err) {
    return false;
  }
};

export const getDisplayedDates = (
  month: Date,
): {
  first: Date;
  last: Date;
} => {
  const firstDayOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const lastDayOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  // Find the first day of the visible grid (Sunday of the week containing the 1st of the month)
  const firstDayOfWeek = firstDayOfMonth.getDay();
  const firstDayDisplayed = new Date(
    firstDayOfMonth.getFullYear(),
    firstDayOfMonth.getMonth(),
    firstDayOfMonth.getDate() - firstDayOfWeek,
  );

  // Find the last day of the visible grid (Saturday of the week containing the last day of the month)
  const lastDayOfWeek = lastDayOfMonth.getDay();
  const lastDayDisplayed = new Date(
    lastDayOfMonth.getFullYear(),
    lastDayOfMonth.getMonth(),
    lastDayOfMonth.getDate() + (6 - lastDayOfWeek),
  );

  return { first: firstDayDisplayed, last: lastDayDisplayed };
};

export const isSameDay = (
  date1: Date | string | null,
  date2: Date | string | null,
) => {
  if (date1 == null) {
    return false;
  }

  if (date2 == null) {
    return false;
  }

  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;

  return d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth();
};

export const toUTCDate = (dateParam: Date | string): Date => {
  const date = typeof dateParam === 'string' ? new Date(dateParam) : dateParam;
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
};
