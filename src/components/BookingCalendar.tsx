import { useState } from "react";
import { Calendar } from "./ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Droplets, Flame } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { addBainReservation, getBainReservations } from '../api/reservations-bain-sauna'
import React, { useEffect, useState } from 'react'

interface Booking {
  id: string;
  date: string;
  hour: number;
  clientName: string;
  clientEmail: string;
}

// Créneaux de 10h à 2h du matin (16 créneaux d'1h)
const TIME_SLOTS = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1];

export function BookingCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  // 🧩 Récupération et ajout des réservations Supabase
const [reservations, setReservations] = useState<any[]>([])

useEffect(() => {
  async function loadReservations() {
    const data = await getBainReservations('bain') // ou 'sauna' selon la page
    setReservations(data)
  }
  loadReservations()
}, [])

async function handleReserve(date: string, start: string, end: string) {
  await addBainReservation('bain', date, start, end)
  alert('Réservation enregistrée ✅')
}

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");

  const [bookings, setBookings] = useState<Booking[]>([]);

  const isSlotBooked = (hour: number) => {
    if (!selectedDate) return false;
    const dateStr = selectedDate.toISOString().split("T")[0];
    return bookings.some(
      (booking) =>
        booking.date === dateStr &&
        booking.hour === hour
    );
  };

  const isSlotSelected = (hour: number) => {
    return selectedSlots.includes(hour);
  };

  const handleSlotClick = (hour: number) => {
    if (isSlotBooked(hour)) return;
    
    // Toggle slot selection
    if (selectedSlots.includes(hour)) {
      setSelectedSlots(selectedSlots.filter(slot => slot !== hour));
    } else {
      setSelectedSlots([...selectedSlots, hour]);
    }
  };

  const handleOpenDialog = () => {
    if (selectedSlots.length > 0) {
      setDialogOpen(true);
    }
  };

  const handleBooking = async () => {
    if (!selectedDate || selectedSlots.length === 0 || !clientName || !clientEmail) return;

    const dateStr = selectedDate.toISOString().split("T")[0];
    const newBookings: Booking[] = selectedSlots.map(hour => ({
      id: `${Date.now()}-${hour}`,
      date: dateStr,
      hour,
      clientName,
      clientEmail,
    }));

    try {
      // Envoyer l'email de notification
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2b20b999/send-booking-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            clientName,
            clientEmail,
            date: selectedDate.toLocaleDateString("fr-FR", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
            slots: selectedSlots,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to send email:", errorData);
        toast.error("Erreur lors de l'envoi de l'email de confirmation");
      } else {
        toast.success("Réservation confirmée ! Un email a été envoyé.");
      }
    } catch (error) {
      console.error("Error sending booking email:", error);
      toast.error("Erreur lors de l'envoi de l'email");
    }

    setBookings([...bookings, ...newBookings]);
    setDialogOpen(false);
    setClientName("");
    setClientEmail("");
    setSelectedSlots([]);
  };

  return (
    <div className="min-h-screen bg-[#2d3748] p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl text-[#c9a66b] mb-4" style={{ fontFamily: 'serif' }}>
            Réservation
          </h1>
          
          {/* Bain Nordique & Sauna Display */}
          <div className="flex items-center justify-center gap-6 mb-4">
            <div className="flex items-center gap-2 px-6 py-3 bg-[#374151] rounded-lg border-2 border-[#c9a66b]">
              <Droplets className="w-6 h-6 text-[#c9a66b]" />
              <span className="text-[#c9a66b]">Bain Nordique</span>
            </div>
            <span className="text-[#c9a66b] text-2xl">&</span>
            <div className="flex items-center gap-2 px-6 py-3 bg-[#374151] rounded-lg border-2 border-[#c9a66b]">
              <Flame className="w-6 h-6 text-[#c9a66b]" />
              <span className="text-[#c9a66b]">Sauna</span>
            </div>
          </div>
          
          <p className="text-gray-300 mb-1">
            Réservez votre créneau par tranche d'une heure
          </p>
          <p className="text-[#c9a66b] text-sm">
            Gratuit - Compris dans le prix de votre séjour
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Section */}
          <Card className="lg:col-span-1 bg-[#374151] border-[#4b5563]">
            <CardHeader>
              <CardTitle className="text-[#c9a66b]">Sélectionnez une date</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                className="rounded-md border-[#4b5563]"
              />
            </CardContent>
          </Card>

          {/* Time Slots Section */}
          <Card className="lg:col-span-2 bg-[#374151] border-[#4b5563]">
            <CardHeader>
              <CardTitle className="text-[#c9a66b] flex items-center gap-3">
                <Droplets className="w-6 h-6" />
                <Flame className="w-6 h-6" />
                {selectedDate
                  ? `Créneaux disponibles - ${selectedDate.toLocaleDateString("fr-FR", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}`
                  : "Sélectionnez une date"}
              </CardTitle>
              <CardDescription className="text-gray-400">
                Réservations disponibles de 10h à 2h du matin. À partir de 2h, le système de traitement et filtration se met en route pour le nettoyage de l'eau.
                <br />
                <span className="text-[#c9a66b]">Cliquez sur plusieurs créneaux pour une réservation multiple.</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {TIME_SLOTS.map((hour) => {
                  const isBooked = isSlotBooked(hour);
                  const isSelected = isSlotSelected(hour);
                  return (
                    <button
                      key={hour}
                      onClick={() => handleSlotClick(hour)}
                      disabled={isBooked}
                      className={`
                        p-4 rounded-lg border-2 transition-all duration-200
                        ${
                          isBooked
                            ? "bg-[#4b5563] border-[#6b7280] text-gray-500 cursor-not-allowed opacity-50"
                            : isSelected
                            ? "bg-[#c9a66b] border-[#c9a66b] text-[#1f2937] cursor-pointer shadow-lg scale-105"
                            : "bg-[#2d3748] border-[#c9a66b] text-[#c9a66b] hover:bg-[#c9a66b] hover:text-[#1f2937] cursor-pointer"
                        }
                      `}
                    >
                      <div className="text-center">
                        <div>
                          {hour}h00 - {hour === 23 ? "0h" : hour === 1 ? "2h" : `${hour + 1}h`}00
                        </div>
                        <div className="text-sm opacity-80">
                          {isBooked ? "Réservé" : isSelected ? "Sélectionné" : "Disponible"}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              
              {/* Bouton de validation */}
              {selectedSlots.length > 0 && (
                <div className="mt-6 flex items-center justify-between bg-[#2d3748] p-4 rounded-lg border-2 border-[#c9a66b]">
                  <div className="text-[#c9a66b]">
                    <span className="font-semibold">{selectedSlots.length}</span> créneau{selectedSlots.length > 1 ? 'x' : ''} sélectionné{selectedSlots.length > 1 ? 's' : ''}
                  </div>
                  <Button 
                    onClick={() => {
  if (!selectedDate || selectedSlots.length === 0) return;
  const dateStr = selectedDate.toISOString().split('T')[0]; // "2025-10-22"
  const startHour = selectedSlots[0];
  const endHour = selectedSlots[selectedSlots.length - 1] + 1;

  // conversion en "HH:00"
  const pad = (n: number) => String(n).padStart(2, "0");
  const startTime = `${pad(startHour)}:00`;
  const endTime = `${pad(endHour)}:00`;

  handleReserve(dateStr, startTime, endTime);
}}

                    className="bg-[#c9a66b] text-[#1f2937] hover:bg-[#b8944d]"
                  >
                    Valider la sélection
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Booking Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="bg-[#374151] border-[#4b5563]">
            <DialogHeader>
              <DialogTitle className="text-[#c9a66b] flex items-center gap-2">
                <Droplets className="w-5 h-5" />
                <Flame className="w-5 h-5" />
                Confirmer votre réservation
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Bain Nordique & Sauna - {selectedDate?.toLocaleDateString("fr-FR")}
                <div className="mt-2 space-y-1">
                  {selectedSlots.sort((a, b) => a - b).map((hour, index) => (
                    <div key={hour} className="text-[#c9a66b]">
                      Créneau {index + 1}: {hour}h00 - {hour === 23 ? "0h" : hour === 1 ? "2h" : `${hour + 1}h`}00
                    </div>
                  ))}
                </div>
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-gray-300">
                  Nom complet
                </Label>
                <Input
                  id="name"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Jean Dupont"
                  className="bg-[#2d3748] border-[#4b5563] text-gray-200 placeholder:text-gray-500"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-gray-300">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="jean@example.com"
                  className="bg-[#2d3748] border-[#4b5563] text-gray-200 placeholder:text-gray-500"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="border-[#4b5563] text-gray-300 hover:bg-[#4b5563]"
              >
                Annuler
              </Button>
              <Button
                onClick={handleBooking}
                disabled={!clientName || !clientEmail}
                className="bg-[#c9a66b] text-[#1f2937] hover:bg-[#b8944d]"
              >
                Confirmer la réservation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
