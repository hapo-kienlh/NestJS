import { Post } from 'src/post/post.entity';
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;

  @Column()
  password: string;

  @Column()
  email: string;

  @Column({ nullable: true, default: null })
  avatar: string | null;

  @OneToMany(() => Post, (post) => post.user)
  posts: Post[];
}
