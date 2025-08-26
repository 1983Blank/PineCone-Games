
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Clock, MousePointer, Crown } from "lucide-react";

export default function Leaderboard({ games = [] }) {
  const validGames = Array.isArray(games) ? games.filter(Boolean) : [];
  const sortedGames = validGames.sort((a, b) => (b.final_score || 0) - (a.final_score || 0));

  if (sortedGames.length === 0) {
    return (
      <Card className="bg-white/80 backdrop-blur shadow-xl border-2 border-yellow-200">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Trophy className="w-8 h-8 text-yellow-500" />
            שיאים אחרונים
          </h2>
          <div className="text-center p-4 text-gray-500">
            עדיין אין שיאים. היה הראשון לשחק ולדורג!
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 backdrop-blur shadow-xl border-2 border-yellow-200">
      <CardContent className="p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Trophy className="w-8 h-8 text-yellow-500" />
          שיאים אחרונים
        </h2>
        <div className="space-y-4">
          {sortedGames.slice(0, 5).map((game, index) => (
            <div
              key={index}
              className={`relative overflow-hidden rounded-xl p-4 ${
                index === 0 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200' :
                index === 1 ? 'bg-gradient-to-r from-gray-50 to-gray-100' :
                index === 2 ? 'bg-gradient-to-r from-orange-50 to-orange-100' : 'bg-white'
              }`}
            >
              {index === 0 && (
                <div className="absolute top-2 right-2">
                  <Crown className="w-6 h-6 text-yellow-500" />
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-lg">
                    {game.winner || "שחקן אנונימי"}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center gap-4 mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {Math.floor((game.total_time || 0) / 60)}:{((game.total_time || 0) % 60).toString().padStart(2, '0')}
                    </span>
                    <span className="flex items-center gap-1">
                      <MousePointer className="w-4 h-4" />
                      {game.total_moves || 0} מהלכים
                    </span>
                  </div>
                </div>
                <div className="text-2xl font-bold text-yellow-600">
                  {game.final_score || 0}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
