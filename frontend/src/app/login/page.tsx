"use client"

import { Button } from "@/components/ui/button"
import Bullfy from "@/components/svg/bullfy"
import React, { useState } from "react"
import ConnectDrawer from "../home/components/connect-drawer"
import { useDisclosure } from "@/lib/hooks/use-diclosure"
import NotificationModal from "@/components/general/modals/notify"

export default function LoginPage() {
  const { onOpen, onClose, isOpen } = useDisclosure()

  // Notification state
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [notificationType, setNotificationType] = useState<"success" | "error" | "warning">("success")
  const [notificationDescription, setNotificationDescription] = useState("This is a sample notification message.")

  // Sample handler to open notification
  const handleOpenNotification = () => {
    setNotificationType("success")
    setNotificationDescription("Wallet connection feature is coming soon!")
    setIsNotificationOpen(true)
  }

  return (
    <>
      <div className="min-h-screen flex flex-col px-6 py-8 relative">
        {/* Background Layer - clickable */}
        <div
          className={`fixed inset-0 bg-[#000019] z-0 cursor-pointer ${isOpen ? "pointer-events-none" : ""}`}
        />

        {/* Mobile Status Bar Simulation */}
        <div className="absolute top-0 left-0 right-0 flex justify-between items-center px-6 py-2 text-white text-sm font-medium opacity-70">
          {/* ... status bar contents ... */}
        </div>

        {/* Main Content - Centered */}
        <div className="flex-1 flex flex-col items-center justify-center relative z-10">
          {/* Bull Character */}
          <div className="mb-8">
            <Bullfy />
          </div>

          {/* Title and Description */}
          <div className="mb-12">
            <h1 className="font-offbit text-white text-4xl font-bold tracking-wider text-center">BULLZ</h1>
          </div>

          <div className="text-center mb-16 px-4 max-w-sm">
            <p className="font-offbit text-gray-300 text-sm font-normal leading-relaxed tracking-wide uppercase">
              CONNECT YOUR WALLET TO START TRADING CRYPTO LIKE A FANTASY MANAGER
            </p>
          </div>

          {/* Wallet Buttons */}
          <div className="w-full max-w-sm space-y-4">
            <Button
              onClick={(event: { preventDefault: () => void }) => {
                event.preventDefault()
                onOpen()
                handleOpenNotification()
              }}
              className="w-full h-14 text-white font-bold text-base tracking-wider uppercase rounded-lg shadow-lg border border-[#FF5324] bg-[#FF5324] hover:opacity-90 transition-opacity font-offbit"
            >
              CONNECT ACCOUNT
            </Button>

            <Button
              onClick={() => onOpen()}
              className="w-full h-14 text-white font-bold text-base tracking-wider uppercase rounded-lg shadow-lg border border-slate-700 hover:opacity-90 transition-opacity bg-slate-gradient font-offbit"
            >
              CONNECT SUI WALLET
            </Button>
          </div>
        </div>
      </div>

      <ConnectDrawer
        isOpen={isOpen}
        onClose={onClose}
        notificationIsOpen={isNotificationOpen}
        notificationOnClose={() => setIsNotificationOpen(false)}
      />

      <NotificationModal
        type={notificationType}
        description={notificationDescription}
        onClose={() => setIsNotificationOpen(false)}
        isOpen={isNotificationOpen}
        isLoading={false}
      />
    </>
  )
}
