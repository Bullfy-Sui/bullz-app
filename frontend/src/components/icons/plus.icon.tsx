import { SVGProps } from "react";

const PlusIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      {...props}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M15.3337 7.33317V8.6665H14.667V9.33317H9.33366V14.6665H8.66699V15.3332H7.33366V14.6665H6.66699V9.33317H1.33366V8.6665H0.666992V7.33317H1.33366V6.6665H6.66699V1.33317H7.33366V0.666504H8.66699V1.33317H9.33366V6.6665H14.667V7.33317H15.3337Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default PlusIcon;
