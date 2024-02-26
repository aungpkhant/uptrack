import { Transaction } from './client/upbank/models';
import crypto from 'crypto';

function subtractDaysFromDate(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
}

const monthShortNames = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function getMonthShortName(month: number) {
  return monthShortNames[month];
}

function hashTransaction(t: Transaction): string {
  const data =
    t.id +
    t.attributes.amount.value +
    t.attributes.description +
    t.relationships.category?.data?.id;
  const hash = crypto.createHash('sha256').update(data).digest('hex');
  return hash;
}

function resolve(path: string, obj: any) {
  return path.split('.').reduce(function (prev, curr) {
    return prev ? prev[curr] : null;
  }, obj || self);
}

export { subtractDaysFromDate, getMonthShortName, hashTransaction, resolve };
