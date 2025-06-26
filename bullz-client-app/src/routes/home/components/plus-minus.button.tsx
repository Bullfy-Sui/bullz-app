import MinusIcon from "@/components/icons/minus.icon";
import PlusIcon from "@/components/icons/plus.icon";

interface Props {
  onClick: () => void;
  type: "positive" | "negative";
}

const PlusMinusButton = (props: Props) => {
  return (
    <div
      onClick={props.onClick}
      style={{
        boxShadow:
          "0px -4px 0px 0px #0000003D inset, 0px 4px 0px 0px #FFFFFF29 inset",
      }}
      className=" h-[2.5rem] flex items-center justify-center p-[0.25rem] w-[2.5rem]"
    >
      {props.type === "negative" && <MinusIcon color="white" />}
      {props.type === "positive" && <PlusIcon color="white" />}
    </div>
  );
};

export default PlusMinusButton;
