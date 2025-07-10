"use client";

import NotificationModal from "@/components/general/modals/notify";
import TitleBar from "@/components/general/title-bar";
import InfoBulbIcon from "@/components/icons/info-bulb.icon";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useDisclosure } from "@/lib/hooks/use-diclosure";
import {
  NotificationStatus,
  useNotificationsModal,
} from "@/lib/hooks/use-notifications-modal";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import {
  FormProvider,
  useForm,
  useWatch,
} from "react-hook-form";
import { useParams, useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useGetUserSquads, useUpdateSquadName, useUpdateSquadPlayers, useDeleteSquad } from "@/lib/hooks/use-squad-contract";
import { useGetPriceList } from "@/common-api-services/token-price.ts";
import Pitch, { Multiplier, Postition } from "../../components/pitch";
import SelectSquadPlayers from "../../components/select-squad.players";
import { formationLayouts, SquadFormation } from "../../constants";
import { FormationLayoutKey, SquadForm } from "../../types";
import SquadNameForm from "../../components/squad-name.form";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const EditSquadPage = () => {
  const { squad_id } = useParams<{ squad_id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // State management
  const [layout, setLayout] = useState(formationLayouts.OneThreeOneTwo);
  const [formation, setFormation] = useState(SquadFormation.OneThreeOneTwo);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [initialData, setInitialData] = useState<SquadForm | null>(null);
  
  // Disclosure hooks
  const {
    onClose,
    onOpen,
    isOpen,
    disclosedData: selectionDrawerData,
  } = useDisclosure<{ focusedPosition: [Postition, Multiplier] }>();
  
  const {
    onClose: closeNotification,
    onOpen: openNotification,
    isOpen: notificationIsOpen,
    disclosedData: notificationModalData,
  } = useDisclosure<NotificationStatus>();
  
  const {
    isOpen: nameFormIsOpen,
    onClose: closeNameForm,
    onOpen: openNameForm,
  } = useDisclosure();

  // Delete confirmation modal
  const {
    isOpen: deleteConfirmIsOpen,
    onClose: closeDeleteConfirm,
    onOpen: openDeleteConfirm,
  } = useDisclosure();

  // Data fetching
  const { data: userSquads, isLoading: isLoadingSquads } = useGetUserSquads();
  const { data: priceList, isLoading: isLoadingPrices } = useGetPriceList();
  
  // Smart contract hooks
  const updateSquadName = useUpdateSquadName();
  const updateSquadPlayers = useUpdateSquadPlayers();
  const deleteSquad = useDeleteSquad();

  // Form setup
  const form = useForm<SquadForm>({
    defaultValues: { 
      name: "",
      formation: "OneThreeOneTwo",
      players: []
    },
    mode: "onChange",
  });
  
  const playerArrayWatch = useWatch({ control: form.control, name: "players" });
  const nameWatch = useWatch({ control: form.control, name: "name" });

  // Find current squad data
  const currentSquad = userSquads?.find(squad => squad.squad_id.toString() === squad_id);

  // Modal content setup - moved before early return to fix hooks ordering
  const modalContent = useNotificationsModal({
    status: notificationModalData || "loading",
    successContent: {
      title: "TEAM UPDATED",
      description:
        "YOUR BULL HAS BEEN UPDATED ON THE BLOCKCHAIN. CHANGES ARE NOW LIVE.",
      buttonLabel: "BACK TO TEAM",
      onButtonClick: () => {
        navigate("/squad");
        closeNotification();
      },
    },
    errorContent: {
      title: "UPDATE FAILED",
      description: "SORRY, WE COULDN'T UPDATE YOUR TEAM ON THE BLOCKCHAIN. PLEASE TRY AGAIN.",
      buttonLabel: "Try Again",
      onButtonClick: () => {
        closeNotification();
      },
    },
    loadingContent: {
      title: "UPDATING TEAM",
      description: isLoading 
        ? "UPDATING YOUR BULL ON THE BLOCKCHAIN..." 
        : "PROCESSING...",
      buttonLabel: "",
      onButtonClick: () => {},
    },
  });

  // Load squad data into form
  useEffect(() => {
    if (currentSquad && priceList && !initialData) {
      console.log("Loading squad data:", currentSquad);
      console.log("Available price data:", priceList);
      
      // Debug: Show available tokens and squad players for comparison
      console.log("🎮 Squad players:", currentSquad.players);
      console.log("💰 Available tokens (first 10):", priceList.slice(0, 10).map(token => ({
        symbol: token.symbol,
        name: token.name,
        imageUrl: token.imageUrl
      })));
      
      // Debug: Show all token symbols for quick reference
      console.log("📋 All token symbols:", priceList.map(token => token.symbol).slice(0, 20));
      
      // Helper function to find token data by player name
      const findTokenData = (playerName: string) => {
        // Try exact symbol match first
        let tokenData = priceList.find(token => token.symbol === playerName);
        
        // Try exact name match
        if (!tokenData) {
          tokenData = priceList.find(token => token.name === playerName);
        }
        
        // Try case-insensitive symbol match
        if (!tokenData) {
          tokenData = priceList.find(token => 
            token.symbol.toLowerCase() === playerName.toLowerCase()
          );
        }
        
        // Try case-insensitive name match
        if (!tokenData) {
          tokenData = priceList.find(token => 
            token.name.toLowerCase() === playerName.toLowerCase()
          );
        }
        
        // Try partial matches (name contains player name or vice versa)
        if (!tokenData) {
          tokenData = priceList.find(token => 
            token.name.toLowerCase().includes(playerName.toLowerCase()) ||
            playerName.toLowerCase().includes(token.name.toLowerCase()) ||
            token.symbol.toLowerCase().includes(playerName.toLowerCase()) ||
            playerName.toLowerCase().includes(token.symbol.toLowerCase())
          );
        }
        
        return tokenData;
      };
      
      // Convert squad data to form format with proper image URLs
      const squadFormData: SquadForm = {
        name: currentSquad.name,
        formation: (currentSquad.formation as FormationLayoutKey) || "OneThreeOneTwo",
        players: currentSquad.players.map((playerName, index) => {
          const tokenData = findTokenData(playerName);
          
          console.log(`🔍 Player "${playerName}" matching:`, {
            playerName,
            foundToken: tokenData ? {
              symbol: tokenData.symbol,
              name: tokenData.name,
              imageUrl: tokenData.imageUrl,
              coinAddress: tokenData.coinAddress
            } : 'NOT FOUND',
            availableTokens: priceList.length
          });
          
          return {
            name: playerName,
            position: index + 1,
            multiplier: 1.0, // Default multiplier - you might want to store this in the contract too
            token_price_id: tokenData?.coinAddress || playerName,
            imageUrl: tokenData?.imageUrl,
          };
        })
      };

      // Set form values
      form.reset(squadFormData);
      setInitialData(squadFormData);
      
      // Set UI state
      const formationValue = Object.values(SquadFormation)[Object.keys(SquadFormation).indexOf(squadFormData.formation)];
      if (formationValue) {
        setFormation(formationValue);
        setLayout(formationLayouts[squadFormData.formation]);
      }
      
      console.log("📊 Final squad form data:", squadFormData);
    }
  }, [currentSquad, priceList, form, initialData]);

  // Track changes
  useEffect(() => {
    if (initialData) {
      const currentData = form.getValues();
      const nameChanged = currentData.name !== initialData.name;
      const playersChanged = JSON.stringify(currentData.players.map(p => p.name)) !== 
                           JSON.stringify(initialData.players.map(p => p.name));
      setHasChanges(nameChanged || playersChanged);
    }
  }, [nameWatch, playerArrayWatch, initialData, form]);

  // Handle update submission
  const onSubmit = form.handleSubmit(async (values) => {
    if (!currentSquad || !initialData || !hasChanges) return;
    
    console.log("Updating squad with values:", values);
    setIsLoading(true);
    openNotification({ data: "loading" });
    
    try {
      const nameChanged = values.name !== initialData.name;
      const playersChanged = JSON.stringify(values.players.map(p => p.name)) !== 
                           JSON.stringify(initialData.players.map(p => p.name));

      if (nameChanged && playersChanged) {
        // Update both name and players - we'll use sequential calls since the contract 
        // doesn't have a single function for updating both with different fees
        await updateSquadName.mutateAsync({
          squadId: currentSquad.squad_id,
          newName: values.name,
        });
        
        await updateSquadPlayers.mutateAsync({
          squadId: currentSquad.squad_id,
          newPlayers: values.players.map(p => p.name),
        });
      } else if (nameChanged) {
        await updateSquadName.mutateAsync({
          squadId: currentSquad.squad_id,
          newName: values.name,
        });
      } else if (playersChanged) {
        await updateSquadPlayers.mutateAsync({
          squadId: currentSquad.squad_id,
          newPlayers: values.players.map(p => p.name),
        });
      }

      console.log("Squad updated successfully");
      closeNameForm();
      queryClient.invalidateQueries({ queryKey: ["user-squads"] });
      openNotification({ data: "success" });
      
      // Reset the initial data to current values
      setInitialData(values);
      setHasChanges(false);
      
    } catch (error) {
      console.error("Squad update failed:", error);
      closeNameForm();
      openNotification({ data: "error" });
    } finally {
      setIsLoading(false);
    }
  });

  // Handle delete
  const handleDelete = async () => {
    if (!currentSquad) return;
    
    setIsLoading(true);
    openNotification({ data: "loading" });
    closeDeleteConfirm();
    
    try {
      await deleteSquad.mutateAsync({
        squadId: currentSquad.squad_id,
      });
      
      console.log("Squad deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["user-squads"] });
      
      // Navigate back to squad list
      navigate("/squad");
      
    } catch (error) {
      console.error("Squad deletion failed:", error);
      openNotification({ data: "error" });
      setIsLoading(false);
    }
  };

  // Show loading while fetching squad data or price data
  if (isLoadingSquads || isLoadingPrices || !currentSquad || !priceList) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="font-offbit text-white mb-2">
            {isLoadingSquads ? "Loading squad..." : 
             isLoadingPrices ? "Loading token data..." : 
             !currentSquad ? "Squad not found..." : 
             "Loading..."}
          </p>
          {(isLoadingSquads || isLoadingPrices) && (
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <FormProvider {...form}>
        <form id="edit-squad-form" onSubmit={onSubmit}>
          <TitleBar title="Edit team" onClick={() => navigate("/squad")} />
          <div className="flex flex-col justify-between h-full">
            <div className="border border-gray-800 bg-background flex gap-[0.625rem] items-center justify-between mb-[1.625rem] mt-[1rem] h-[2.5rem]">
              {Object.values(SquadFormation).map((value) => (
                <span
                  className={cn(
                    "w-[4.25rem] text-white h-full text-center text-[0.875rem] leading-[100%] tracking-[0.04em] font-bold font-offbit flex items-center justify-center cursor-pointer",
                    {
                      "bg-gray-800": formation === value,
                    },
                  )}
                  style={{
                    boxShadow:
                      formation === value
                        ? "0px -4px 0px 0px #0000003D inset, 0px 4px 0px 0px #FFFFFF29 inset"
                        : "",
                  }}
                  key={value}
                  onClick={() => {
                    const formation = Object.keys(SquadFormation).find(
                      (k) => SquadFormation[k as FormationLayoutKey] === value,
                    );
                    form.setValue("formation", formation as FormationLayoutKey);
                    setFormation(value as SquadFormation);
                    setLayout(
                      formationLayouts[formation as FormationLayoutKey],
                    );
                  }}
                >
                  {value}
                </span>
              ))}
            </div>
            
            <div className="flex flex-col items-center justify-center w-[17.5rem] mx-auto gap-[1rem] mb-[1.5rem]">
              <InfoBulbIcon />
              <p className="font-offbit w-[17.5rem] font-[700] tracking-[0.04em] leading-[100%] text-center text-[1.0625rem] text-gray-300 uppercase">
                Edit your formation above, tap a position below to change a token. When you're done, click Update.
              </p>
              
              {/* Action buttons */}
              <div className="flex flex-col gap-[0.5rem] w-full">
                <Button
                  type="button"
                  onClick={() => openNameForm()}
                  variant={hasChanges ? "default" : "secondary"}
                  className="w-full"
                  disabled={!hasChanges || isLoading}
                >
                  {hasChanges ? "Update Team" : "No Changes"}
                </Button>
                
                <Button
                  type="button"
                  onClick={() => openDeleteConfirm()}
                  variant="destructive"
                  className="w-full bg-red-600 hover:bg-red-700"
                  disabled={isLoading}
                >
                  Delete Team
                </Button>
              </div>
            </div>
            
            <Pitch
              layout={layout}
              players={playerArrayWatch}
              onPlayerClick={(player) => {
                onOpen({
                  data: {
                    focusedPosition: [player.position, player.multiplier],
                  },
                });
              }}
              onEmptyPlayerClick={(pos) => {
                onOpen({ data: { focusedPosition: pos } });
              }}
              ctaLabel="Update"
            />
          </div>
        </form>

        {/* Squad name form - moved inside FormProvider */}
        <SquadNameForm
          isOpen={nameFormIsOpen}
          onClose={closeNameForm}
          isLoading={isLoading}
          formId="edit-squad-form"
          submitButtonText="Update team"
        />
        
        {/* Token selection drawer - moved inside FormProvider */}
        <Sheet open={isOpen}>
          <SheetContent side="bottom" className="border-none h-screen">
            <div className="w-[24.375rem] mx-auto px-[1.25rem] overflow-y-scroll">
              {selectionDrawerData && (
                <SelectSquadPlayers
                  list={layout.flat()}
                  onClose={onClose}
                  initialFocusedPosition={selectionDrawerData.focusedPosition}
                />
              )}
            </div>
          </SheetContent>
        </Sheet>
      </FormProvider>

      {/* Delete confirmation modal */}
      <Dialog open={deleteConfirmIsOpen}>
        <DialogContent
          style={{
            boxShadow:
              "0px 3.82px 2.55px 0px #00000040, 0px -8px 0px 0px #0000003D inset, 0px 8px 0px 0px #FFFFFF3D inset",
          }}
          className="max-w-[17.5rem] bg-gray-800 rounded-none border-none w-[23.875rem] p-0 py-[2rem] px-[1.5rem]"
        >
          <div className="gap-[1rem] flex flex-col items-center">
            <div className="text-center space-y-[1rem]">
              <h2 className="text-[1.0625rem] font-[700] tracking-[0.04em] leading-[100%] text-red-400">
                DELETE TEAM
              </h2>
              <p className="text-gray-300 uppercase text-[1.0625rem] tracking-[0.04em] font-[700] text-center leading-[100%]">
                ARE YOU SURE YOU WANT TO DELETE "{currentSquad?.name}"? THIS ACTION CANNOT BE UNDONE.
              </p>
            </div>
            
            <div className="flex flex-col gap-[0.5rem] w-full">
              <Button
                onClick={handleDelete}
                className="h-[3rem] w-full px-[1.5rem] bg-red-600 hover:bg-red-700"
                disabled={isLoading}
              >
                {isLoading ? "Deleting..." : "YES, DELETE"}
              </Button>
              <Button
                variant="secondary"
                disabled={isLoading}
                onClick={() => closeDeleteConfirm()}
                className="h-[3rem] w-full px-[1.5rem]"
              >
                CANCEL
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notification modal */}
      <NotificationModal
        isOpen={notificationIsOpen}
        onClose={closeNotification}
        onButtonClick={modalContent?.onButtonClick}
        buttonLabel={modalContent?.buttonLabel}
        status={modalContent?.status || "loading"}
        title={modalContent?.title}
        description={modalContent?.description}
      />
    </>
  );
};

export default EditSquadPage; 