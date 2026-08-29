import academic from './academic/index.js';
import activities from './activities/index.js';
import analytics from './analytics/index.js';
import attendance from './attendance/index.js';
import audit from './audit/index.js';
import auth from './auth/index.js';
import calendar from './calendar/index.js';
import evaluations from './evaluations/index.js';
import groups from './groups/index.js';
import guardians from './guardians/index.js';
import imports from './imports/index.js';
import institutions from './institutions/index.js';
import notifications from './notifications/index.js';
import platform from './platform/index.js';
import materials from './materials/index.js';
import students from './students/index.js';
import users from './users/index.js';

/**
 * API composition root for the modular monolith.
 *
 * Modules remain in the same process and share infrastructure, but their
 * HTTP entrypoints are registered in one explicit, auditable list.
 */
export const apiModules = [
    auth,
    users,
    students,
    guardians,
    academic,
    groups,
    evaluations,
    analytics,
    activities,
    materials,
    platform,
    notifications,
    institutions,
    audit,
    calendar,
    attendance,
    imports,
];
