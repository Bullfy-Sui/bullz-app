import { cn } from "@/lib/utils";
import { ClassNameValue } from "tailwind-merge";

interface Props {
  imageUrl: string;
  classNames?: ClassNameValue;
}
// 0.46125
const UserPlayerDp = (props: Props) => {
  return (
    <div
      className={cn(
        "w-[4.37rem] h-[4.37rem] border-4 border-white rounded-[0.6725rem] relative",
        props.classNames,
      )}
    >
      <img
        src={props.imageUrl}
        alt=""
        className="object-fill rounded-[0.3725rem]"
      />
    </div>
  );
};

export default UserPlayerDp;
