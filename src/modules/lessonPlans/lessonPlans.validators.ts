import { z } from 'zod';
import { objectIdSchema } from '../../shared/common.validators.js';

const fields = z.object({
    session_id: objectIdSchema,
    topic: z.string().trim().max(500).optional(),
    learning_objective: z.string().trim().max(2000).optional(),
    description: z.string().trim().max(5000).optional(),
    teacher_notes: z.string().trim().max(5000).optional(),
    homework: z.string().trim().max(2000).optional(),
    status: z.enum(['draft', 'completed']).optional(),
});

export const createLessonPlanSchema = { body: fields.passthrough() };
export const lessonPlanBySessionSchema = { params: z.object({ sessionId: objectIdSchema }) };
export const updateLessonPlanSchema = {
    params: z.object({ id: objectIdSchema }),
    body: fields.omit({ session_id: true }).partial().passthrough().refine((value) => Object.keys(value).length > 0, 'Debes enviar al menos un campo'),
};
