import PlusCircle from "@/components/icons/plus-circle.icon";

interface AddNewSquadButtonProps {
  onClick: () => void;
}

const AddNewSquadButton = (props: AddNewSquadButtonProps) => {
  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-[#161626] rounded-lg">
      {/* "YOUR BULLZ" header */}
      <h3 className="text-white text-sm font-medium tracking-[0.2em]">YOUR BULLZ</h3>
      
      {/* Add button */}
      <button
        onClick={props.onClick}
        className="flex flex-col items-center justify-center gap-1 p-2 w-20 h-20 text-white cursor-pointer hover:bg-white/10 transition-colors rounded"
      >
        <div className="text-3xl font-thin leading-none">+</div>
        <div className="text-xs tracking-wider mt-1">ADD</div>
      </button>
    </div>
  );
};

export default AddNewSquadButton;