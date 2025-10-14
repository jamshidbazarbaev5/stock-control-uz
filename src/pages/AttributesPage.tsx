import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import type { Attribute } from "@/types/attribute";
import { attributeApi } from "@/core/api/attribute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      toast.error(t("messages.error.failed_to_load_attributes"));
      console.error(error);
    }
  };

  useEffect(() => {
    loadAttributes();
  }, []);

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("navigation.attributes")}</CardTitle>

          <Button
            onClick={() => {
              navigate("/attributes/new");
            }}
          >
            {t("common.add_attribute")}
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.name")}</TableHead>
                <TableHead>{t("table.field_type")}</TableHead>
                <TableHead>{t("table.russian_translation")}</TableHead>
                <TableHead>{t("table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attributes.map((attribute) => (
                <TableRow key={attribute.id}>
                  <TableCell>{attribute.name}</TableCell>
                  <TableCell>{attribute.field_type}</TableCell>
                  <TableCell>{attribute.translations.ru}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigate(`/attributes/${attribute.id}/edit`);
                      }}
                    >
                      {t("common.edit")}
                    </Button>
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
