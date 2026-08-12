import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/en';

import { normalizeLanguage } from './i18n';

dayjs.extend(relativeTime);
dayjs.extend(utc);

const getIntlLocale = (language) => (normalizeLanguage(language) === 'zh-CN' ? 'zh-CN' : 'en-US');

const getDayjsLocale = (language) => (normalizeLanguage(language) === 'zh-CN' ? 'zh-cn' : 'en');

/**
 * 后端时间统一按 UTC 存储/返回。无时区后缀的 ISO 字符串按 UTC 解析，
 * 带时区的字符串由 JS Date 自动转换，保证在任何浏览器时区下显示正确。
 */
export const parseBackendTime = (value) => {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === 'number') {
    return new Date(value);
  }
  if (typeof value === 'string' && !/(Z|[+-]\d{2}:?\d{2})$/.test(value)) {
    return new Date(`${value.replace(' ', 'T')}Z`);
  }
  return new Date(value);
};

export const formatDateTime = (value, language) => {
  const date = parseBackendTime(value);
  if (!date) {
    return '-';
  }

  return new Intl.DateTimeFormat(getIntlLocale(language), {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(date);
};

export const formatRelativeTime = (value, language) => {
  const date = parseBackendTime(value);
  if (!date) {
    return '-';
  }

  dayjs.locale(getDayjsLocale(language));
  return dayjs(date).fromNow();
};
