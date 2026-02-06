// src/models/Nutrition.model.ts
import {
  Table,
  Column,
  Model,
  DataType,
  Index,
  DefaultScope,
  Scopes
} from 'sequelize-typescript';

@Table({
  tableName: 'nutrition',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: false,
      fields: ['category']
    },
    {
      unique: false,
      fields: ['day']
    },
    {
      unique: false,
      fields: ['is_active']
    }
  ]
})
@DefaultScope(() => ({
  where: { is_active: true },
  order: [['day', 'ASC NULLS LAST'], ['sort_order', 'ASC']]
}))
@Scopes(() => ({
  byDay: (day: number) => ({
    where: { day }
  }),
  byCategory: (category: string) => ({
    where: { category }
  }),
  recipes: {
    where: { category: 'recipe' }
  },
  tips: {
    where: { category: 'tip' }
  }
}))
export class Nutrition extends Model<Nutrition> {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4
  })
  id!: string;

  @Index
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: 'Day of program (1-30), null for general tips'
  })
  day!: number | null;

  @Column({
    type: DataType.STRING(200),
    allowNull: false
  })
  title!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false
  })
  description!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'detailed_content'
  })
  detailedContent!: string | null;

  @Column({
    type: DataType.STRING(500),
    allowNull: true,
    field: 'image_url'
  })
  imageUrl!: string | null;

  @Column({
    type: DataType.STRING(500),
    allowNull: true,
    field: 'video_url'
  })
  videoUrl!: string | null;

  @Column({
    type: DataType.ENUM('breakfast', 'lunch', 'dinner', 'snack', 'general', 'recipe', 'tip'),
    defaultValue: 'general'
  })
  category!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true
  })
  calories!: number | null;

  @Column({
    type: DataType.ARRAY(DataType.STRING),
    defaultValue: []
  })
  ingredients!: string[];

  @Column({
    type: DataType.ARRAY(DataType.TEXT),
    defaultValue: [],
    field: 'preparation_steps'
  })
  preparationSteps!: string[];

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
    field: 'prep_time'
  })
  prepTime!: string | null;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  })
  isActive!: boolean;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    field: 'sort_order'
  })
  sortOrder!: number;
  @Column({
  type: DataType.INTEGER,
  allowNull: true,
  field: 'protein_g'
})
proteinG!: number | null;

@Column({
  type: DataType.INTEGER,
  allowNull: true,
  field: 'carbs_g'
})
carbsG!: number | null;

@Column({
  type: DataType.INTEGER,
  allowNull: true,
  field: 'fat_g'
})
fatG!: number | null;

@Column({
  type: DataType.INTEGER,
  allowNull: true,
  field: 'fiber_g'
})
fiberG!: number | null;

@Column({
  type: DataType.INTEGER,
  allowNull: true,
  field: 'servings'
})
servings!: number | null;

@Column({
  type: DataType.ENUM('beginner', 'intermediate', 'advanced'),
  allowNull: true,
  defaultValue: 'intermediate'
})
difficulty!: string;
}

export default Nutrition;