from sqlalchemy import Column, Integer, String, Text, DateTime, ARRAY
from sqlalchemy.sql import func
from database.connection import Base

class Recipe(Base):
    __tablename__ = "recipes"

    recipe_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)  # Foreign key to accounts.user_id (creator)
    title = Column(String, nullable=False)
    description = Column(Text)
    ingredients = Column(ARRAY(String), nullable=False) 
    instructions = Column(ARRAY(String), nullable=False)
    category = Column(String, nullable=False)
    prep_time = Column(Integer, nullable=False)
    servings = Column(Integer, nullable=False)
    difficulty = Column(String, nullable=False) 
    image_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def to_dict(self):
        return {
            "recipe_id": self.recipe_id,
            "user_id": self.user_id,
            "title": self.title,
            "description": self.description,
            "ingredients": self.ingredients,
            "instructions": self.instructions,
            "category": self.category,
            "prep_time": self.prep_time,
            "servings": self.servings,
            "difficulty": self.difficulty,
            "image_url": self.image_url,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }