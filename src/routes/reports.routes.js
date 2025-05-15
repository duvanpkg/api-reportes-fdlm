import { Router } from "express";
const router = Router();

import * as generateReportCtrl from "../controllers/reports/generate.controller.js";
import * as manuallyReportsCtrl from "../controllers/reports/manuallyReports.controller.js";

router.post("/generate-report", generateReportCtrl.generate);
router.post("/upload-report-carpeta", manuallyReportsCtrl.uploadReportCarpeta);
router.post("/force-report-generation", manuallyReportsCtrl.forceGenerateReport);
router.post("/download-report", manuallyReportsCtrl.generateReportInPdf);

export default router;
