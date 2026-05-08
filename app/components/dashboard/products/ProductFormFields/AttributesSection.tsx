import { useCallback } from "react";
import { Plus, Trash2 } from "lucide-react";
import { InputField } from "~/components/shared/FormFields";
import type { AttributeItem } from "./hooks/useAttributes";

interface AttributesSectionProps {
  attributes: AttributeItem[];
  onAdd: () => void;
  onUpdate: (index: number, field: keyof AttributeItem, value: string) => void;
  onRemove: (index: number) => void;
}

export const AttributesSection: React.FC<AttributesSectionProps> = ({
  attributes, onAdd, onUpdate, onRemove,
}) => (
  <div className="card bg-base-200 border border-white/5 shadow-xl">
    <div className="card-body gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-[10px] uppercase opacity-50 tracking-widest">
          Attributs dynamiques
        </h3>
        <button type="button" onClick={onAdd} className="btn btn-sm btn-outline gap-2">
          <Plus size={14} /> Ajouter
        </button>
      </div>

      <div className="space-y-3">
        {attributes.map((attribute, index) => (
          <div key={index} className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-5">
              <InputField
                label="Clé"
                name="attribute_key"
                value={attribute.key}
                onChange={useCallback(
                  (e: React.ChangeEvent<HTMLInputElement>) => onUpdate(index, "key", e.target.value),
                  [index, onUpdate]
                )}
                placeholder="Ex: taille"
              />
            </div>
            <div className="col-span-6">
              <InputField
                label="Valeur"
                name="attribute_value"
                value={attribute.value}
                onChange={useCallback(
                  (e: React.ChangeEvent<HTMLInputElement>) => onUpdate(index, "value", e.target.value),
                  [index, onUpdate]
                )}
                placeholder="Ex: M"
              />
            </div>
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="btn btn-square btn-sm btn-error"
              aria-label="Supprimer attribut"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  </div>
);