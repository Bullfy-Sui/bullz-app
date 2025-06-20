import ChevronRight from "../icons/chevron-right";

interface TitleBarProps {
  title: string;
  onClick: () => void;
}

const TitleBar = (props: TitleBarProps) => {
  return (
    <div className="flex items-center bg-background mt-[1rem] h-[3rem] px-[1.5rem]">
      <ChevronRight onClick={props.onClick} className="cursor-pointer" />
      <span className="block text-center flex-1 text-white text-[1.0625rem] leading-[100%] tracking-[0.04em] font-[700] uppercase">
        {props.title}
      </span>
    </div>
  );
};

export default TitleBar;
