import { MeetDetail } from "@amurex/web/components/MeetDetail";
import styles from "./TranscriptDetail.module.css";
import { MeetLoader } from "@amurex/ui/components";

const TranscriptDetail = ({ params }: { params: { id: string } }) => {
  return <MeetDetail styles={styles} params={params} />;
};

export default TranscriptDetail;
