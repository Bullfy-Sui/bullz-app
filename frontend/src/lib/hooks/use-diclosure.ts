"use client";

import React from "react";

export const useDisclosure = <TData>(initialData?: TData) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [data, setData] = React.useState<TData | undefined>(initialData);
  const onOpen = (arg?: { data?: TData }) => {
    if (arg?.data) {
      setData(arg?.data);
    }
    setIsOpen(true);
  };
  const onClose = (arg?: { data?: TData }) => {
    if (arg?.data) {
      setData(arg?.data);
    }
    setIsOpen(false);
  };
  const onToggle = () => setIsOpen(!isOpen);
  return {
    isOpen,
    onOpen,
    onClose,
    onToggle,
    disclosedData: data,
    updateData: setData,
  };
};
