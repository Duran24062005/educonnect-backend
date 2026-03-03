import { Router } from 'express';
import EvaluationController from '../controllers/EvaluationController.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(protect);

// ---- Grade Items ----
router.get('/grade-items', EvaluationController.getGradeItems); // ?period_id=&area_id=
router.post('/grade-items', authorize('admin', 'teacher'), EvaluationController.createGradeItem);
router.put('/grade-items/:id', authorize('admin', 'teacher'), EvaluationController.updateGradeItem);
router.delete('/grade-items/:id', authorize('admin', 'teacher'), EvaluationController.deleteGradeItem);

// ---- Calificaciones ----
router.post('/scores', authorize('admin', 'teacher'), EvaluationController.registerScore);
router.get('/scores/student/:student_id', EvaluationController.getScoresByStudent);
router.get('/scores/grade-item/:grade_item_id', authorize('admin', 'teacher'), EvaluationController.getScoresByGradeItem);

// ---- Resultados por periodo ----
router.post('/period-results/calculate', authorize('admin', 'teacher'), EvaluationController.calculatePeriodResult);
router.get('/period-results/student/:student_id', EvaluationController.getPeriodResultsByStudent);

// ---- Resultados finales ----
router.post('/final-results/calculate', authorize('admin'), EvaluationController.calculateFinalResult);
router.get('/final-results/school-year/:school_year_id', authorize('admin'), EvaluationController.getFinalResultsByYear);
router.get('/final-results/student/:student_id/year/:school_year_id', EvaluationController.getStudentFinalResult);
router.get('/stats/school-year/:school_year_id', authorize('admin'), EvaluationController.getYearStats);

export default router;
