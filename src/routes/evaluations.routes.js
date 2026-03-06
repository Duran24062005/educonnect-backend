import { Router } from 'express';
import EvaluationController from '../controllers/EvaluationController.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import {
    listGradeItemsSchema,
    createGradeItemSchema,
    updateGradeItemSchema,
    deleteGradeItemSchema,
    registerScoreSchema,
    scoresByStudentSchema,
    scoresByGradeItemSchema,
    calculatePeriodResultSchema,
    periodResultsByStudentSchema,
    calculateFinalResultSchema,
    finalResultsByYearSchema,
    studentFinalResultSchema,
    yearStatsSchema,
} from '../validators/evaluations.validators.js';

const router = Router();

router.use(protect);

router.get('/grade-items', validateRequest(listGradeItemsSchema), EvaluationController.getGradeItems);
router.post('/grade-items', authorize('admin', 'teacher'), validateRequest(createGradeItemSchema), EvaluationController.createGradeItem);
router.put('/grade-items/:id', authorize('admin', 'teacher'), validateRequest(updateGradeItemSchema), EvaluationController.updateGradeItem);
router.delete('/grade-items/:id', authorize('admin', 'teacher'), validateRequest(deleteGradeItemSchema), EvaluationController.deleteGradeItem);

router.post('/scores', authorize('admin', 'teacher'), validateRequest(registerScoreSchema), EvaluationController.registerScore);
router.get('/scores/student/:student_id', validateRequest(scoresByStudentSchema), EvaluationController.getScoresByStudent);
router.get('/scores/grade-item/:grade_item_id', authorize('admin', 'teacher'), validateRequest(scoresByGradeItemSchema), EvaluationController.getScoresByGradeItem);

router.post('/period-results/calculate', authorize('admin', 'teacher'), validateRequest(calculatePeriodResultSchema), EvaluationController.calculatePeriodResult);
router.get('/period-results/student/:student_id', validateRequest(periodResultsByStudentSchema), EvaluationController.getPeriodResultsByStudent);

router.post('/final-results/calculate', authorize('admin'), validateRequest(calculateFinalResultSchema), EvaluationController.calculateFinalResult);
router.get('/final-results/school-year/:school_year_id', authorize('admin'), validateRequest(finalResultsByYearSchema), EvaluationController.getFinalResultsByYear);
router.get('/final-results/student/:student_id/year/:school_year_id', validateRequest(studentFinalResultSchema), EvaluationController.getStudentFinalResult);
router.get('/stats/school-year/:school_year_id', authorize('admin'), validateRequest(yearStatsSchema), EvaluationController.getYearStats);

export default router;
