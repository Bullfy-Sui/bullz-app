import PlusIcon from "@/components/icons/plus.icon";
import { cn } from "@/lib/utils";

interface AddNewSquadButtonProps {
  onClick: () => void;
  classNames?: string;
}

const AddNewSquadButton = (props: AddNewSquadButtonProps) => {
  return (
    <>
      <div
        onClick={props.onClick}
        className={cn(
          "bg-gray-800 cursor-pointer border-[0.5px] border-dashed  border-gray-300 flex flex-col items-center justify-center gap-[0.79rem] p-[0.5rem] w-[5.25rem] h-[5.25rem]",
          props.classNames
        )}
        style={{
          boxShadow:
            "0px -8px 0px 0px #0000003D inset, 0px 8px 0px 0px #FFFFFF29 inset",
        }}
      >
        <PlusIcon color="#9898B3" />
        <span className="text-gray-300 font-[700] text-[0.875rem] leading-[100%]">
          ADD
        </span>
      </div>
    </>
  );
};

export default AddNewSquadButton;
