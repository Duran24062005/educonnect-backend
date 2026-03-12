export const ACTIVITY_ALLOWED_EXTENSIONS = [
    'link',
    'png',
    'jpg',
    'jpeg',
    'pdf',
    'docx',
    'ppt',
    'pptx',
    'txt',
    'md',
];

export const ACTIVITY_FILE_SIZE_LIMIT = 20 * 1024 * 1024;
export const ACTIVITY_UPLOAD_SUBDIR = 'activity-submissions';

export const ACTIVITY_STATUS = {
    PUBLISHED: 'published',
};

export const ACTIVITY_SUBMISSION_STATUS = {
    SUBMITTED: 'submitted',
    GRADED: 'graded',
};

export const ACTIVITY_SUBMISSION_TYPE = {
    FILE: 'file',
    LINK: 'link',
};

export const STUDENT_ACTIVITY_STATES = [
    'upcoming',
    'pending',
    'submitted',
    'graded',
    'late',
];
