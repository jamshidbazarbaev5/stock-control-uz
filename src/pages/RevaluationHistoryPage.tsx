import React from "react";
import { RevaluationHistory } from "../components/RevaluationHistory";
import { useTranslation } from "react-i18next";

const RevaluationHistoryPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">{t("common.revaluation_history")}</h1>
      <RevaluationHistory />
    </div>
  );
};

export default RevaluationHistoryPage;