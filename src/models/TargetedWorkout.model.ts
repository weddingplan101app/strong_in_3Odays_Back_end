// src/models/TargetedWorkout.model.ts
import {
  Table,
  Column,
  Model,
  DataType,
  HasMany,
  DefaultScope,
  Scopes
} from 'sequelize-typescript';
import { TargetedWorkoutClip } from './TargetedWorkoutClip.model';
import { Op } from 'sequelize';

@Table({
  tableName: 'targeted_workouts',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: false,
      fields: ['body_part']
    },
    {
      unique: false,
      fields: ['gender_target']
    },
    {
      unique: false,
      fields: ['difficulty']
    },
    {
      unique: false,
      fields: ['is_active']
    },
    {
      unique: false,
      fields: ['category']
    }
  ]
})
@DefaultScope(() => ({
  where: { is_active: true },
  order: [['sort_order', 'ASC'], ['created_at', 'DESC']]
}))
@Scopes(() => ({
  forMen: {
    where: { gender_target: 'male' }
  },
  forWomen: {
    where: { gender_target: 'female' }
  },
  forBoth: {
    where: { gender_target: 'both' }
  },
  byBodyPart: (bodyPart: string) => ({
    where: { body_part: bodyPart }
  }),
  byDifficulty: (difficulty: string) => ({
    where: { difficulty }
  }),
  byCategory: (category: string) => ({
    where: { category }
  }),
  quickWorkouts: {
    where: {
      total_duration: {
        [Op.between]: [180, 300] // 3-5 minutes in seconds
      }
    }
  }
}))
export class TargetedWorkout extends Model<TargetedWorkout> {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4
  })
  id!: string;

  @Column({
    type: DataType.STRING(200),
    allowNull: false
  })
  title!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  description!: string | null;

  // ✅ Derived from clips (6 clips × 30 seconds = 180 seconds = 3 minutes)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 180,
    comment: 'Total duration in seconds (sum of all clips)'
  })
  totalDuration!: number;

  @Column({
    type: DataType.VIRTUAL(DataType.STRING),
    get() {
      const self = this as any as TargetedWorkout;
      const minutes = Math.floor(self.totalDuration / 60);
      const seconds = self.totalDuration % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    },
    field: 'duration_formatted'
  })
  durationFormatted!: string;

  // ✅ Body part focus
  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    field: 'body_part',
    comment: 'chest, arms, abs, legs, glutes, shoulders, back, full_body'
  })
  bodyPart!: string;

  // ✅ Gender target
  @Column({
    type: DataType.ENUM('male', 'female', 'both'),
    defaultValue: 'both',
    field: 'gender_target'
  })
  genderTarget!: string;

  // ✅ Category: Belly Fat, Toning, Strength, etc.
  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    field: 'category',
    comment: 'belly_fat, toning, strength, cardio, flexibility'
  })
  category!: string;

  @Column({
    type: DataType.ENUM('beginner', 'intermediate', 'advanced'),
    defaultValue: 'beginner'
  })
  difficulty!: string;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 40,
    field: 'calories_burned',
    comment: 'Estimated calories burned for complete workout'
  })
  caloriesBurned!: number;

  // ✅ Number of 30-second clips (should match clips count)
  @Column({
    type: DataType.INTEGER,
    defaultValue: 6,
    field: 'clip_count',
    comment: 'Number of 30-second clips in this workout'
  })
  clipCount!: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    field: 'thumbnail_key'
  })
  thumbnailKey!: string;

  @Column({
    type: DataType.VIRTUAL(DataType.STRING),
    get() {
      const self = this as any as TargetedWorkout;
      const thumbnailKey = self.thumbnailKey;
      
      if (!thumbnailKey) return null;
      
      const bucketName = process.env.DO_SPACES_BUCKET || 'your-bucket-name';
      const region = process.env.DO_SPACES_REGION || 'nyc3';
      
      if (process.env.DO_SPACES_CDN_URL) {
        return `${process.env.DO_SPACES_CDN_URL}/${thumbnailKey}`;
      }
      
      return `https://${bucketName}.${region}.digitaloceanspaces.com/${thumbnailKey}`;
    },
    field: 'thumbnail_url'
  })
  thumbnailUrl!: string;

  // ✅ Equipment requirement
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    field: 'equipment_required'
  })
  equipmentRequired!: boolean;

  // ✅ Focus areas (array)
  @Column({
    type: DataType.ARRAY(DataType.STRING),
    defaultValue: [],
    field: 'focus_areas'
  })
  focusAreas!: string[];

  // ✅ Tags for search/filter
  @Column({
    type: DataType.ARRAY(DataType.STRING),
    defaultValue: [],
    field: 'tags'
  })
  tags!: string[];

  // ✅ View count for popularity
  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    field: 'view_count'
  })
  viewCount!: number;

  // ✅ Average rating
  @Column({
    type: DataType.FLOAT,
    defaultValue: 0.0,
    field: 'rating'
  })
  rating!: number;

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

  // ✅ Has many clips (30-second videos)
  @HasMany(() => TargetedWorkoutClip, 'targeted_workout_id')
  clips!: TargetedWorkoutClip[];

  // Helper methods
  // Get workout type based on body part
  getWorkoutType(): string {
    const fullBodyParts = ['full_body', 'cardio'];
    const upperBodyParts = ['chest', 'arms', 'shoulders', 'back'];
    const lowerBodyParts = ['legs', 'glutes', 'thighs'];
    const coreParts = ['abs', 'core'];

    if (fullBodyParts.includes(this.bodyPart)) return 'full_body';
    if (upperBodyParts.includes(this.bodyPart)) return 'upper_body';
    if (lowerBodyParts.includes(this.bodyPart)) return 'lower_body';
    if (coreParts.includes(this.bodyPart)) return 'core';
    return 'other';
  }

  // Get gender-specific title
  getGenderSpecificTitle(): string {
    if (this.genderTarget === 'male') return `${this.title} (For Men)`;
    if (this.genderTarget === 'female') return `${this.title} (For Women)`;
    return this.title;
  }

  // Increment view count
  async incrementViewCount(): Promise<void> {
    await this.update({
      viewCount: this.viewCount + 1
    });
  }
}

export default TargetedWorkout;