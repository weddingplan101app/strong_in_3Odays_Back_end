// src/models/Program.model.ts
import {
  Table,
  Column,
  Model,
  DataType,
  HasMany,
  DefaultScope
} from 'sequelize-typescript';
import { WorkoutVideo } from './WorkoutVideo.model';

@Table({
  tableName: 'programs',
  timestamps: true,
  underscored: true
})
@DefaultScope(() => ({
  where: { 
    status: 'published',
    is_active: true 
  }
}))
export class Program extends Model<Program> {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4
  })
  id!: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    unique: true,
    comment: 'URL-friendly identifier'
  })
  slug!: string;

  @Column({
    type: DataType.STRING(200),
    allowNull: false
  })
  name!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  description!: string | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 30,
    comment: 'Duration in days'
  })
  duration!: number;

  @Column({
    type: DataType.ENUM('beginner', 'intermediate', 'advanced'),
    defaultValue: 'beginner'
  })
  difficulty!: string;

  @Column({
    type: DataType.ENUM('male', 'female', 'both'),
    defaultValue: 'both'
  })
  genderTarget!: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    field: 'equipment_required'
  })
  equipmentRequired!: boolean;

  @Column({
    type: DataType.STRING(500),
    allowNull: true,
    field: 'cover_image_url'
  })
  coverImageUrl!: string | null;

  @Column({
    type: DataType.ENUM('draft', 'published', 'archived'),
    defaultValue: 'draft'
  })
  status!: string;

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
    defaultValue: 0,
    field: 'enrollment_count'
  })
  enrollmentCount!: number;

  @HasMany(() => WorkoutVideo)
  workoutVideos!: WorkoutVideo[];

  @Column({
    type: DataType.VIRTUAL(DataType.INTEGER),
    get() {
      const self = this as any as Program;
      if (self.workoutVideos && self.workoutVideos.length > 0) {
        return self.workoutVideos.reduce((total, video) => total + (video.duration || 0), 0);
      }
      return 0;
    },
    field: 'total_duration'
  })
  totalDuration!: number;

  @Column({
    type: DataType.VIRTUAL(DataType.INTEGER),
    get() {
      const self = this as any as Program;
      return self.workoutVideos?.length || 0;
    },
    field: 'video_count'
  })
  videoCount!: number;


}

export default Program;