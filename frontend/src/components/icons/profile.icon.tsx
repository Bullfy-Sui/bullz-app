import { SVGProps } from "react";

const ProfileIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      {...props}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7 9H6V5H7V3H8V2H10V1H14V2H16V3H17V5H18V9H17V11H16V12H14V13H10V12H8V11H7V9Z"
        fill="currentColor"
      />
      <path
        d="M22 19V22H21V23H3V22H2V19H3V18H4V17H5V16H7V15H17V16H19V17H20V18H21V19H22Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default ProfileIcon;
