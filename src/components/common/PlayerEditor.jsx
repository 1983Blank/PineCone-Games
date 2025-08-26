import React, { useState, useEffect } from 'react';
import { GamePlayer } from '@/api/entities';
import { User } from '@/api/entities';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Save, Edit2 } from "lucide-react";

const AVATARS = [
  { id: 'bear', labelHe: 'דובי', labelEn: 'Bear', emoji: '🐻' },
  { id: 'rabbit', labelHe: 'ארנב', labelEn: 'Rabbit', emoji: '🐰' },
  { id: 'cat', labelHe: 'חתול', labelEn: 'Cat', emoji: '🐱' },
  { id: 'dog', labelHe: 'כלב', labelEn: 'Dog', emoji: '🐶' },
  { id: 'fox', labelHe: 'שועל', labelEn: 'Fox', emoji: '🦊' },
  { id: 'tiger', labelHe: 'נמר', labelEn: 'Tiger', emoji: '🐯' },
  { id: 'monkey', labelHe: 'קוף', labelEn: 'Monkey', emoji: '🐵' },
  { id: 'panda', labelHe: 'פנדה', labelEn: 'Panda', emoji: '🐼' }
];

export default function PlayerEditor({ player, onUpdate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(player.name);
  const [selectedAvatar, setSelectedAvatar] = useState(player.avatar);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
    } catch (err) {
      console.error("Error loading user:", err);
    }
  };

  const t = (key) => {
    if (!user) return key;
    
    if (user.language === 'en') {
      const enTranslations = {
        "Edit Player": "Edit Player",
        "Player Name": "Player Name",
        "Enter name": "Enter name",
        "Choose Avatar": "Choose Avatar",
        "Cancel": "Cancel",
        "Save Changes": "Save Changes",
        "Error updating player": "Error updating player"
      };
      return enTranslations[key] || key;
    }
    
    const heTranslations = {
      "Edit Player": "עריכת שחקן",
      "Player Name": "שם השחקן",
      "Enter name": "הזן שם",
      "Choose Avatar": "בחר אווטאר",
      "Cancel": "ביטול",
      "Save Changes": "שמור שינויים",
      "Error updating player": "שגיאה בעדכון השחקן"
    };
    return heTranslations[key] || key;
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    
    try {
      setIsLoading(true);
      const updatedPlayer = await GamePlayer.update(player.id, {
        ...player,
        name: name.trim(),
        avatar: selectedAvatar
      });
      
      if (onUpdate) {
        onUpdate(updatedPlayer);
      }
      
      setIsOpen(false);
    } catch (error) {
      console.error('Error updating player:', error);
      alert(t('Error updating player'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="absolute top-1 left-1 opacity-0 group-hover:opacity-100">
          <Edit2 className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Edit Player')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 p-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('Player Name')}</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('Enter name')}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">{t('Choose Avatar')}</label>
            <div className="grid grid-cols-4 gap-2">
              {AVATARS.map(avatar => (
                <button
                  key={avatar.id}
                  onClick={() => setSelectedAvatar(avatar.id)}
                  className={`p-2 rounded-lg text-2xl ${
                    selectedAvatar === avatar.id 
                      ? 'bg-blue-100 ring-2 ring-blue-400' 
                      : 'hover:bg-gray-100'
                  }`}
                  title={user?.language === 'en' ? avatar.labelEn : avatar.labelHe}
                >
                  {avatar.emoji}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              {t('Cancel')}
            </Button>
            <Button onClick={handleSave} disabled={isLoading || !name.trim()}>
              <Save className="w-4 h-4 ml-2" />
              {t('Save Changes')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}