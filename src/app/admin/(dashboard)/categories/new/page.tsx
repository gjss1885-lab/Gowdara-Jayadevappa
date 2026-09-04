import { CategoryForm } from "../CategoryForm";

export default function NewCategoryPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-ink">Add Category</h1>
      <CategoryForm />
    </div>
  );
}
