import PlusIcon from "@/components/icons/plus.icon";
import { cn } from "@/lib/utils";

interface AddNewSquadButtonProps {
  onClick: () => void;
  classNames?: string;
  disabled?: boolean;
}

const AddNewSquadButton = (props: AddNewSquadButtonProps) => {
  return (
    <>
      <div
        onClick={props.disabled ? undefined : props.onClick}
        className={cn(
          "bg-gray-800 border-[0.5px] border-dashed border-gray-300 flex flex-col items-center justify-center gap-[0.79rem] p-[0.5rem] w-[5.25rem] h-[5.25rem]",
          {
            "cursor-pointer": !props.disabled,
            "cursor-not-allowed opacity-50": props.disabled,
          },
          props.classNames
        )}
        style={{
          boxShadow:
            "0px -8px 0px 0px #0000003D inset, 0px 8px 0px 0px #FFFFFF29 inset",
        }}
      >
        <PlusIcon color={props.disabled ? "#6B6B6B" : "#9898B3"} />
        <span className={cn(
          "font-[700] text-[0.875rem] leading-[100%]",
          props.disabled ? "text-gray-500" : "text-gray-300"
        )}>
          ADD
        </span>
      </div>
    </>
  );
};

export default AddNewSquadButton;
