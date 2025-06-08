import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, X, Image } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AgencyLogoUploadProps {
  agencyId: number;
  agencyName: string;
  currentLogoUrl?: string | null;
}

export function AgencyLogoUpload({ agencyId, agencyName, currentLogoUrl }: AgencyLogoUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('logo', file);
      
      const response = await fetch(`/api/agencies/${agencyId}/upload-logo`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Logo uploaded successfully",
        description: `Logo for ${agencyName} has been updated.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/agencies"] });
      setIsOpen(false);
      setSelectedFile(null);
      setPreviewUrl("");
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/agencies/${agencyId}/logo`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Remove failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Logo removed",
        description: `Logo for ${agencyName} has been removed.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/agencies"] });
      setIsOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Remove failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please select a JPEG, PNG, GIF, or WebP image.",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const handleRemove = () => {
    removeMutation.mutate();
  };

  const resetForm = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Image className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Agency Logo</DialogTitle>
          <DialogDescription>
            Upload or remove the logo for {agencyName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Current logo display */}
          {currentLogoUrl && !selectedFile && (
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <img 
                  src={currentLogoUrl} 
                  alt={`${agencyName} logo`}
                  className="h-12 w-12 object-contain"
                />
                <span className="text-sm text-muted-foreground">Current logo</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemove}
                disabled={removeMutation.isPending}
              >
                <X className="h-4 w-4 mr-1" />
                Remove
              </Button>
            </div>
          )}

          {/* File upload section */}
          <div className="space-y-3">
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileSelect}
              className="cursor-pointer"
            />
            
            {/* Preview selected file */}
            {selectedFile && previewUrl && (
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <img 
                    src={previewUrl} 
                    alt="Preview"
                    className="h-12 w-12 object-contain"
                  />
                  <div>
                    <p className="text-sm font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleUpload}
                  disabled={uploadMutation.isPending}
                  size="sm"
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Upload
                </Button>
              </div>
            )}
          </div>

          {/* Help text */}
          <p className="text-xs text-muted-foreground">
            Supported formats: JPEG, PNG, GIF, WebP. Maximum size: 5MB.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}