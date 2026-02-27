import { Router } from 'express';
import EvaluationController from '../controllers/EvaluationController.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(protect);

// ---- Grade Items ----
router.get('/grade-items', EvaluationController.getGradeItems); // ?period_id=&area_id=
router.post('/grade-items', authorize('Admin', 'Teacher'), EvaluationController.createGradeItem);
router.put('/grade-items/:id', authorize('Admin', 'Teacher'), EvaluationController.updateGradeItem);
router.delete('/grade-items/:id', authorize('Admin', 'Teacher'), EvaluationController.deleteGradeItem);

// ---- Calificaciones ----
router.post('/scores', authorize('Admin', 'Teacher'), EvaluationController.registerScore);
router.get('/scores/student/:student_id', EvaluationController.getScoresByStudent);
router.get('/scores/grade-item/:grade_item_id', authorize('Admin', 'Teacher'), EvaluationController.getScoresByGradeItem);

// ---- Resultados por periodo ----
router.post('/period-results/calculate', authorize('Admin', 'Teacher'), EvaluationController.calculatePeriodResult);
router.get('/period-results/student/:student_id', EvaluationController.getPeriodResultsByStudent);

// ---- Resultados finales ----
router.post('/final-results/calculate', authorize('Admin'), EvaluationController.calculateFinalResult);
router.get('/final-results/school-year/:school_year_id', authorize('Admin'), EvaluationController.getFinalResultsByYear);
router.get('/final-results/student/:student_id/year/:school_year_id', EvaluationController.getStudentFinalResult);
router.get('/stats/school-year/:school_year_id', authorize('Admin'), EvaluationController.getYearStats);

export default router;