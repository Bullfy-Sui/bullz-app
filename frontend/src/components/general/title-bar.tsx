import ChevronRight from "../icons/chevron-right";

interface TitleBarProps {
  title: string;
  onClick: () => void;
}

const TitleBar = (props: TitleBarProps) => {
  return (
    <div className="flex items-center bg-background mt-[1rem] mb-[1.62875rem]">
      <ChevronRight onClick={props.onClick} className="cursor-pointer" />
      <span className="block text-center flex-1 text-white text-[1rem] leading-[120%] font-[600]">
        {props.title}
      </span>
    </div>
  );
};

export default TitleBar;
