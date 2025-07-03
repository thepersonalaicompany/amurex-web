"use client";

import { useState } from "react";
import { Dialog, DialogTrigger, DialogContent } from "./ui/dialog";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from "./ui/card";
import { Button } from "./ui/Button";
import { Label } from "./ui/label";
import { Input } from "./ui/Input";
import { AlertTriangle } from "lucide-react";

export const DeleteAccPopup = ({ userEmail, handleDeleteAccount }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [deleteInput, setDeleteInput] = useState("");

  // Check if both conditions are met
  const isEmailMatch = emailInput === userEmail;
  const isDeleteTyped = deleteInput.toLowerCase() === "delete";
  const canDelete = isEmailMatch && isDeleteTyped;

  const handleDelete = async () => {
    if (canDelete) {
      await handleDeleteAccount();
      // Reset form
      setEmailInput("");
      setDeleteInput("");
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setEmailInput("");
    setDeleteInput("");
  };

  return (
    <div className="p-4">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="destructive"
            className="text-sm bg-zinc-800 hover:bg-red-500 hover:text-white text-red-500 whitespace-nowrap flex items-center mt-auto w-fit group"
          >
            Delete Your Account
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <Card className="border-0 shadow-none">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-red-600">
                Delete Your Account
              </CardTitle>
              <CardDescription className="text-sm text-gray-600">
                Are you sure you want to delete your account? This action cannot
                be undone. All your data will be permanently deleted, including
                your emails, documents, and threads. Type &quot;DELETE&quot; to
                confirm.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Your email: {userEmail}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email to confirm"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className={`${
                    emailInput && !isEmailMatch
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : isEmailMatch
                      ? "border-green-500 focus:border-green-500 focus:ring-green-500"
                      : ""
                  }`}
                />
                {emailInput && !isEmailMatch && (
                  <p className="text-xs text-red-500">Email does not match</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm" className="text-sm font-medium">
                  Type &quot;delete&quot; to confirm
                </Label>
                <Input
                  id="confirm"
                  placeholder="Type delete"
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  className={`${
                    deleteInput && !isDeleteTyped
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : isDeleteTyped
                      ? "border-green-500 focus:border-green-500 focus:ring-green-500"
                      : ""
                  }`}
                />
                {deleteInput && !isDeleteTyped && (
                  <p className="text-red-500">
                    Type &quot;DELETE&quot; to confirm.
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1 bg-transparent"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={!canDelete}
                className={`flex-1 ${
                  canDelete
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-gray-300 cursor-not-allowed"
                }`}
              >
                Delete Account
              </Button>
            </CardFooter>
          </Card>
        </DialogContent>
      </Dialog>
    </div>
  );
};
