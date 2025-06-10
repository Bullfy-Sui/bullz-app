import { SVGProps } from "react";

const LeaguesIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      {...props}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M2 13V12H1V10H2V9H7V12H8V13H2Z" fill="#7A7A99" />
      <path d="M5 7H4V5H5V4H7V5H8V6H7V8H5V7Z" fill="#7A7A99" />
      <path
        d="M8 7H9V6H10V5H14V6H15V7H16V11H15V12H14V13H10V12H9V11H8V7Z"
        fill="#7A7A99"
      />
      <path
        d="M19 18H20V21H19V22H5V21H4V18H5V17H6V16H8V15H16V16H18V17H19V18Z"
        fill="#7A7A99"
      />
      <path d="M23 10V12H22V13H16V12H17V9H22V10H23Z" fill="#7A7A99" />
      <path d="M17 6H16V5H17V4H19V5H20V7H19V8H17V6Z" fill="#7A7A99" />
    </svg>
  );
};

export default LeaguesIcon;
