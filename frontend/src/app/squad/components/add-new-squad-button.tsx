import PlusCircle from "@/components/icons/plus-circle.icon";
import PlusIcon from "@/components/icons/plus.icon";

interface AddNewSquadButtonProps {
  onClick: () => void;
}

const AddNewSquadButton = (props: AddNewSquadButtonProps) => {
  return (
    <>
      <div
        onClick={props.onClick}
        className="bg-gray-800 cursor-pointer border-[0.5px] border-dashed  border-gray-300 flex flex-col items-center justify-center gap-[0.79rem] p-[0.5rem] w-[5.25rem] h-[5.25rem]"
        style={{
          boxShadow:
            "0px -8px 0px 0px #0000003D inset, 0px 8px 0px 0px #FFFFFF29 inset",
        }}
      >
        <PlusIcon />
        <span className="text-modal-desc font-[700] text-[0.875rem] leading-[100%]">
          ADD
        </span>
      </div>
    </>
  );
};

export default AddNewSquadButton;
