import * as z from "zod";

export const CategorySchema = z.object({
    "id": z.number(),
    "description": z.string()
});
export type Category = z.infer<typeof CategorySchema>;

export const ContentDescriptorsSchema = z.object({
    "ids": z.array(z.any()),
    "notes": z.null(),
});
export type ContentDescriptors = z.infer<typeof ContentDescriptorsSchema>;

export const GenreSchema = z.object({
    "id": z.string(),
    "description": z.string(),
});
export type Genre = z.infer<typeof GenreSchema>

export const MetacriticSchema = z.object({
    "score": z.number(),
    "url": z.string()
});
export type Metacritic = z.infer<typeof MetacriticSchema>;

export const MovieSchema = z.object({
    "id": z.number(),
    "name": z.string(),
    "thumbnail": z.string(),
    "dash_av1": z.string(),
    "dash_h264": z.string(),
    "hls_h264": z.string(),
    "highlight": z.boolean()
});
export type Movie = z.infer<typeof MovieSchema>;

export const SubSchema = z.object({
    "packageid": z.number(),
    "percent_savings_text": z.string(),
    "percent_savings": z.number(),
    "option_text": z.string(),
    "option_description": z.string(),
    "can_get_free_license": z.string(),
    "is_free_license": z.boolean(),
    "price_in_cents_with_discount": z.number(),
});
export type Sub = z.infer<typeof SubSchema>;

export const PcRequirementsSchema = z.object({
    "minimum": z.string(),
    "recommended": z.string(),
});
export type PcRequirements = z.infer<typeof PcRequirementsSchema>;

export const PlatformsSchema = z.object({
    "windows": z.boolean(),
    "mac": z.boolean(),
    "linux": z.boolean(),
});
export type Platforms = z.infer<typeof PlatformsSchema>;

export const PriceOverviewSchema = z.object({
    "currency": z.string(),
    "initial": z.number(),
    "final": z.number(),
    "discount_percent": z.number(),
    "initial_formatted": z.string(),
    "final_formatted": z.string()
});
export type PriceOverview = z.infer<typeof PriceOverviewSchema>;

export const RatingSchema = z.object({
    "rating": z.string(),
    "use_age_gate": z.string(),
    "required_age": z.string(),
    "descriptors": z.string().optional(),
});
export type Rating = z.infer<typeof RatingSchema>;

export const RecommendationsSchema = z.object({
    "total": z.number(),
});
export type Recommendations = z.infer<typeof RecommendationsSchema>;

export const ReleaseDateSchema = z.object({
    "coming_soon": z.boolean(),
    "date": z.string(),
});
export type ReleaseDate = z.infer<typeof ReleaseDateSchema>

export const ScreenshotSchema = z.object({
    "id": z.number(),
    "path_thumbnail": z.string(),
    "path_full": z.string(),
});
export type Screenshot = z.infer<typeof ScreenshotSchema>;

export const SupportInfoSchema = z.object({
    "url": z.string(),
    "email": z.string(),
});
export type SupportInfo = z.infer<typeof SupportInfoSchema>;

export const PackageGroupSchema = z.object({
    "name": z.string(),
    "title": z.string(),
    "description": z.string(),
    "selection_text": z.string(),
    "save_text": z.string(),
    "display_type": z.number(),
    "is_recurring_subscription": z.string(),
    "subs": z.array(SubSchema),
});
export type PackageGroup = z.infer<typeof PackageGroupSchema>;

export const DataSchema = z.object({
    "type": z.string(),
    "name": z.string(),
    "steam_appid": z.number(),
    "required_age": z.string(),
    "is_free": z.boolean(),
    "detailed_description": z.string(),
    "about_the_game": z.string(),
    "short_description": z.string(),
    "supported_languages": z.string(),
    "header_image": z.string(),
    "capsule_image": z.string(),
    "capsule_imagev5": z.string(),
    "website": z.string(),
    "pc_requirements": PcRequirementsSchema,
    "mac_requirements": z.array(z.any()),
    "linux_requirements": z.array(z.any()),
    "legal_notice": z.string(),
    "developers": z.array(z.string()),
    "publishers": z.array(z.string()),
    "price_overview": PriceOverviewSchema,
    "packages": z.array(z.number()),
    "package_groups": z.array(PackageGroupSchema),
    "platforms": PlatformsSchema,
    "metacritic": MetacriticSchema,
    "categories": z.array(CategorySchema),
    "genres": z.array(GenreSchema),
    "screenshots": z.array(ScreenshotSchema),
    "movies": z.array(MovieSchema),
    "recommendations": RecommendationsSchema,
    "release_date": ReleaseDateSchema,
    "support_info": SupportInfoSchema,
    "background": z.string(),
    "background_raw": z.string(),
    "content_descriptors": ContentDescriptorsSchema,
    "ratings": z.record(z.string(), RatingSchema),
});
export type Data = z.infer<typeof DataSchema>;

export const SteamAppSchema = z.object({
    "success": z.boolean(),
    "data": DataSchema,
});
export type SteamApp = z.infer<typeof SteamAppSchema>;

// export const WelcomeSchema = z.object({
//     "21110": The21110Schema,
// });
// export type Welcome = z.infer<typeof WelcomeSchema>;