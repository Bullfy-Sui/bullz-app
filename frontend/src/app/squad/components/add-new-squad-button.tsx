import PlusCircle from "@/components/icons/plus-circle.icon";

interface AddNewSquadButtonProps {
  onClick: () => void;
}

const AddNewSquadButton = (props: AddNewSquadButtonProps) => {
  return (
    <>
      <div
        onClick={props.onClick}
        className="bg-[#000019] cursor-pointer border-[0.81px] border-white flex flex-col items-center gap-[1rem] px-[0.9375rem] rounded-[0.403125rem] py-[1.70875rem] w-[8.0625rem]"
        style={{
          boxShadow: "1.61px 1.61px 6.45px 0px #FEBF1899 inset",
        }}
      >
        <PlusCircle />
        <span className="text-[#D2CACA]">Add new</span>
      </div>
    </>
  );
};

export default AddNewSquadButton;
