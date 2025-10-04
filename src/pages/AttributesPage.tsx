import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import type { Attribute } from "@/types/attribute";
import { attributeApi } from "@/core/api/attribute";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AttributesPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  // const [selectedAttribute, setSelectedAttribute] = useState<Attribute | null>(null);

  const loadAttributes = async () => {
    try {
      const data = await attributeApi.getAll();
      setAttributes(data);
    } catch (error) {
      toast.error(t("Failed to load attributes"));
      console.error(error);
    }
  };

  useEffect(() => {
    loadAttributes();
  }, []);



  const handleDelete = async (id: number) => {
    if (!window.confirm(t("Are you sure you want to delete this attribute?"))) {
      return;
    }

    try {
      await attributeApi.delete(id);
      toast.success(t("Attribute deleted successfully"));
      await loadAttributes();
    } catch (error) {
      toast.error(t("Failed to delete attribute"));
      console.error(error);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("Attributes")}</CardTitle>
          <CardDescription>
            {t("Manage custom attributes for your items")}
          </CardDescription>
          <Button
            onClick={() => {
              navigate("/attributes/new");
            }}
          >
            {t("Add Attribute")}
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("Name")}</TableHead>
                <TableHead>{t("Field Type")}</TableHead>
                <TableHead>{t("Russian Translation")}</TableHead>
                <TableHead>{t("Actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attributes.map((attribute) => (
                <TableRow key={attribute.id}>
                  <TableCell>{attribute.name}</TableCell>
                  <TableCell>{attribute.field_type}</TableCell>
                  <TableCell>{attribute.translations.ru}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigate(`/attributes/${attribute.id}/edit`);
                        }}
                      >
                        {t("Edit")}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(attribute.id!)}
                      >
                        {t("Delete")}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}