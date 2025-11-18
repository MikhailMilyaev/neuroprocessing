import { useOutletContext } from "react-router-dom";
import EducationListHeader from "../../../components/Education/EducationList/EducationListHeader/EducationListHeader";
import EducationListCard from "../../../components/Education/EducationList/EducationListCard/EducationListCard";
import { educationArticles } from "../../../components/Education/articles";
import classes from "./EducationList.module.css";

export default function EducationList() {
  let outlet = {};
  try {
    outlet = useOutletContext() || {};
  } catch {}

  const onOpenSidebar = outlet.onOpenSidebar || (() => {});
  const isSidebarOpen = !!outlet.isSidebarOpen;

  return (
    <div className={classes.wrap}>
      <EducationListHeader
        onOpenSidebar={onOpenSidebar}
        isSidebarOpen={isSidebarOpen}
      />

      <div className={classes.list}>
        {educationArticles.map((article, idx) => (
          <EducationListCard
            key={article.id || idx}
            article={article}
            index={idx}
          />
        ))}
      </div>
    </div>
  );
}
