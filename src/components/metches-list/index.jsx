import { MetchItem } from "@/components";

export const MetchesList = ({ metches }) => {
  if (!metches || metches.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {metches.map((metch, index) => (
        <MetchItem key={index} metch={metch} />
      ))}
    </div>
  );
};
