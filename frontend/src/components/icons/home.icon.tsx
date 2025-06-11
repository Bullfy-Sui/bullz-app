import { SVGProps } from "react";

const HomeIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      {...props}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22 10V11H19V21H18V22H14V15H8V22H4V21H3V11H0V10H1V9H2V8H3V7H4V6H5V5H6V4H7V3H8V2H9V1H10V0H12V1H13V2H14V3H15V4H16V5H17V6H18V7H19V8H20V9H21V10H22Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default HomeIcon;
