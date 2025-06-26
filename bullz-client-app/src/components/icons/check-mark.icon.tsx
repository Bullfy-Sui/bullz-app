import { SVGProps } from "react";

const CheckMarkIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      width="48"
      height="38"
      viewBox="0 0 48 38"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M46.7595 1.88745C48.4135 3.54142 48.4135 6.22311 46.7595 7.87691L18.5241 36.1123C16.8701 37.7663 14.1888 37.7663 12.5346 36.1123L1.24048 24.8181C-0.413493 23.1641 -0.413493 20.4829 1.24048 18.8288C2.89445 17.1748 5.57613 17.1748 7.23011 18.8288L15.5294 27.1278L28.1495 14.5077L40.7702 1.88745C42.4242 0.23348 45.1054 0.23348 46.7595 1.88745Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default CheckMarkIcon;
