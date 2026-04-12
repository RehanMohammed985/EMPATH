import os
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

def ensure_folder(folder):
    if not os.path.exists(folder):
        os.makedirs(folder)

def get_initials(name):
    parts = name.split()
    return ''.join(p[0] for p in parts).upper()

def get_topic_category(topic):
    if topic == "Universal basic income should replace traditional welfare systems.":
        return "debatable_topic"
    elif topic == "Food provides energy for the body":
        return "universal_fact"
    elif topic == " Humans should colonize other planets instead of fixing Earth":
        return "controversial_topic"
    elif topic == "Humans should colonize other planets instead of fixing Earth":
        return "controversial_topic"
    else:
        return "other"

flexibility_groups = {
    "Highly Rigid": ["INTJ", "ENTJ", "ISTJ", "ESTJ"],
    "Moderately Rigid": ["ENFJ", "ISFJ", "ISTP", "ESTP"],
    "Moderately Flexible": ["INFJ", "INTP", "ESFJ", "ISFP"],
    "Highly Flexible": ["ENFP", "ENTP", "INFP", "ESFP"]
}

# ==== ORIGINAL CUMULATIVE PLOTS ==== #

def plot_character_participation(csv_file, output_folder='plots'):
    df = pd.read_csv(csv_file)

    df['initials'] = df['character'].apply(get_initials)
    df['label'] = df['initials'] + " (" + df['personality'] + ")"

    participation = df.groupby('label')['conversation'].nunique().sort_values(ascending=False)

    plt.figure(figsize=(10,6))
    participation.plot(kind='bar', color='skyblue')
    plt.ylabel('Number of Conversations')
    plt.xlabel('Character (Initials and Personality)')
    plt.title('Character Participation Across Conversations')
    plt.xticks(rotation=45, ha='right')
    plt.tight_layout()

    ensure_folder(output_folder)
    output_path = os.path.join(output_folder, 'character_participation.png')
    plt.savefig(output_path)
    plt.close()
    print(f"Saved character participation graph to {output_path}")

def plot_opinion_delta_heatmap(csv_file, output_folder='plots'):
    df = pd.read_csv(csv_file)

    df['initials'] = df['character'].apply(get_initials)
    df['label'] = df['initials'] + " (" + df['personality'] + ")"

    df_filtered = df[df['turn'].isin([0,6])]
    pivot = df_filtered.pivot_table(index=['label', 'conversation'], columns='turn', values='opinion')
    pivot = pivot.dropna(subset=[0,6])
    pivot['delta'] = (pivot[6] - pivot[0]).abs()
    heatmap_data = pivot['delta'].unstack(level=1)

    new_cols = {conv: f"C{int(conv.split('_')[1]) + 1}" for conv in heatmap_data.columns}
    heatmap_data.rename(columns=new_cols, inplace=True)

    plt.figure(figsize=(12,8))
    sns.heatmap(heatmap_data, annot=True, cmap='coolwarm', center=0, linewidths=0.5)
    plt.title('Absolute Opinion Change (Turn 6 - Turn 1) per Character per Conversation')
    plt.ylabel('Character (Initials and Personality)')
    plt.xlabel('Conversation')
    plt.tight_layout()

    ensure_folder(output_folder)
    output_path = os.path.join(output_folder, 'opinion_delta_heatmap.png')
    plt.savefig(output_path)
    plt.close()
    print(f"Saved opinion delta heatmap to {output_path}")

# ==== NEW COMBINED CATEGORY-SUBGROUPED PLOTS ==== #

def plot_character_participation_combined(csv_file, output_folder='plots'):
    df = pd.read_csv(csv_file)
    df['initials'] = df['character'].apply(get_initials)
    df['label'] = df['initials'] + " (" + df['personality'] + ")"
    df['category'] = df['topic'].apply(get_topic_category)

    categories = sorted(df['category'].unique())
    ncols = 2
    nrows = (len(categories) + ncols - 1) // ncols
    fig, axs = plt.subplots(nrows, ncols, figsize=(12, 5*nrows), squeeze=False)
    
    for ax, category in zip(axs.flatten(), categories):
        participation = df[df['category'] == category].groupby('label')['conversation'].nunique().sort_values(ascending=False)
        participation.plot(kind='bar', ax=ax, color='skyblue')
        ax.set_title(f'Character Participation: {category.replace("_", " ").title()}')
        ax.set_ylabel('Number of Conversations')
        ax.set_xlabel('Character (Initials and Personality)')
        ax.tick_params(axis='x', rotation=45)
    
    # Remove unused subplots
    for ax in axs.flatten()[len(categories):]:
        fig.delaxes(ax)
    
    plt.tight_layout()
    ensure_folder(output_folder)
    output_path = os.path.join(output_folder, 'character_participation_combined.png')
    plt.savefig(output_path)
    plt.close()
    print(f"Saved combined character participation graph to {output_path}")

def plot_opinion_delta_heatmap_combined(csv_file, output_folder='plots'):
    df = pd.read_csv(csv_file)
    df['initials'] = df['character'].apply(get_initials)
    df['label'] = df['initials'] + " (" + df['personality'] + ")"
    df['category'] = df['topic'].apply(get_topic_category)

    categories = sorted(df['category'].unique())
    ncols = 1
    nrows = len(categories)
    fig, axs = plt.subplots(nrows, ncols, figsize=(14, 5*nrows), squeeze=False)

    for i, category in enumerate(categories):
        df_cat = df[df['category'] == category]
        df_filtered = df_cat[df_cat['turn'].isin([0,6])]
        pivot = df_filtered.pivot_table(index=['label', 'conversation'], columns='turn', values='opinion')
        pivot = pivot.dropna(subset=[0,6])
        pivot['delta'] = (pivot[6] - pivot[0]).abs()
        heatmap_data = pivot['delta'].unstack(level=1)

        new_cols = {conv: f"C{int(conv.split('_')[1]) + 1}" for conv in heatmap_data.columns}
        heatmap_data.rename(columns=new_cols, inplace=True)

        sns.heatmap(heatmap_data, annot=True, cmap='coolwarm', center=0, linewidths=0.5, ax=axs[i, 0])
        axs[i, 0].set_title(f'Opinion Change Heatmap: {category.replace("_", " ").title()}')
        axs[i, 0].set_ylabel('Character (Initials and Personality)')
        axs[i, 0].set_xlabel('Conversation')

    plt.tight_layout()
    ensure_folder(output_folder)
    output_path = os.path.join(output_folder, 'opinion_delta_heatmap_combined.png')
    plt.savefig(output_path)
    plt.close()
    print(f"Saved combined opinion delta heatmap to {output_path}")

def plot_turn0_turn6_by_topic(csv_file, output_folder='plots'):
    df = pd.read_csv(csv_file)

    df['initials'] = df['character'].apply(get_initials)
    df['label'] = df['initials'] + " (" + df['personality'] + ")"
    df['conv_num'] = df['conversation'].apply(lambda x: f"C{int(x.split('_')[1]) + 1}")
    df['label_full'] = df['label'] + " - " + df['conv_num']

    df_filtered = df[df['turn'].isin([0, 6])]
    unique_characters = df['label'].unique()
    color_palette = sns.color_palette("deep", len(unique_characters))
    color_map = dict(zip(unique_characters, color_palette))

    topics = df['topic'].unique()

    for topic in topics:
        topic_df = df_filtered[df_filtered['topic'] == topic]

        pivot = topic_df.pivot_table(index='label_full', columns='turn', values='opinion', aggfunc='mean')
        pivot = pivot.dropna(subset=[0, 6])
        pivot['base_label'] = pivot.index.map(lambda x: x.split(' - ')[0])

        plt.figure(figsize=(12, 6))
        legend_handles = {}

        for idx, row in pivot.iterrows():
            base_label = row['base_label']
            color = color_map.get(base_label, 'gray')
            plt.plot([0, 6], [row[0], row[6]], marker='o', label=idx, color=color)
            if base_label not in legend_handles:
                handle = plt.Line2D([0], [0], color=color, marker='o', linestyle='-')
                legend_handles[base_label] = handle

        plt.xticks([0, 6])
        plt.xlabel("Turn")
        plt.ylabel("Opinion")
        plt.title(f"Turn 0 vs Turn 6 Opinions by Character\nTopic: {get_topic_category(topic)}")
        plt.grid(True)

        handles = list(legend_handles.values())
        labels = list(legend_handles.keys())
        plt.legend(handles, labels, title="Character", bbox_to_anchor=(1.05, 1), loc='upper left', fontsize='small')

        plt.tight_layout()
        ensure_folder(output_folder)
        safe_topic = topic.replace(" ", "_").replace("/", "_").replace("?", "").replace(".", "")
        output_path = os.path.join(output_folder, f"turn0_turn6_lines_{safe_topic}.png")
        plt.savefig(output_path)
        plt.close()
        print(f"Saved turn 0 vs turn 6 line graph to {output_path}")

def plot_turn0_turn6_by_topic_combined(csv_file, output_folder='plots'):
    df = pd.read_csv(csv_file)
    df['initials'] = df['character'].apply(get_initials)
    df['label'] = df['initials'] + " (" + df['personality'] + ")"
    df['conv_num'] = df['conversation'].apply(lambda x: f"C{int(x.split('_')[1]) + 1}")
    df['label_full'] = df['label'] + " - " + df['conv_num']
    df['category'] = df['topic'].apply(get_topic_category)

    df_filtered = df[df['turn'].isin([0, 6])]
    unique_characters = df['label'].unique()
    color_palette = sns.color_palette("deep", len(unique_characters))
    color_map = dict(zip(unique_characters, color_palette))

    categories = sorted(df['category'].unique())
    ncols = len(categories)
    nrows = 1  # single row layout
    fig, axs = plt.subplots(nrows, ncols, figsize=(6 * ncols, 6), squeeze=False)

    for i, category in enumerate(categories):
        topic_df = df_filtered[df_filtered['category'] == category]

        pivot = topic_df.pivot_table(index='label_full', columns='turn', values='opinion', aggfunc='mean')
        pivot = pivot.dropna(subset=[0, 6])
        pivot['base_label'] = pivot.index.map(lambda x: x.split(' - ')[0])

        ax = axs[0, i]
        legend_handles = {}

        for idx, row in pivot.iterrows():
            base_label = row['base_label']
            color = color_map.get(base_label, 'gray')
            ax.plot([0, 6], [row[0], row[6]], marker='o', color=color, alpha=0.9)

            if base_label not in legend_handles:
                handle = plt.Line2D([0], [0], color=color, marker='o', linestyle='-')
                legend_handles[base_label] = handle

        ax.set_xticks([0, 6])
        ax.set_xlabel("Turn")
        ax.set_ylabel("Opinion")
        ax.set_title(f"{category.replace('_', ' ').title()}", fontsize=12, fontweight='bold')
        ax.grid(True, linestyle='--', alpha=0.5)

        handles = list(legend_handles.values())
        labels = list(legend_handles.keys())
        ax.legend(handles, labels, title="Character", fontsize='small', loc='best')

    plt.tight_layout()
    ensure_folder(output_folder)
    output_path = os.path.join(output_folder, 'turn0_turn6_lines_combined_side_by_side.png')
    plt.savefig(output_path)
    plt.close()
    print(f"✅ Saved side-by-side Turn 0 vs Turn 6 line graphs to {output_path}")

def plot_average_opinion_per_turn_by_conversation_combined(csv_file, output_folder='plots'):
    df = pd.read_csv(csv_file)
    df['category'] = df['topic'].apply(get_topic_category)

    topics = sorted(df['topic'].unique())

    ensure_folder(output_folder)

    # For each topic, plot all conversations belonging to it in a subplot grid
    for topic in topics:
        topic_df = df[df['topic'] == topic]
        conv_list = sorted(topic_df['conversation'].unique())
        n_convs = len(conv_list)

        ncols = 3
        nrows = (n_convs + ncols - 1) // ncols

        fig, axs = plt.subplots(nrows, ncols, figsize=(5 * ncols, 4 * nrows), squeeze=False)
        axs_flat = axs.flatten()

        for i, conv in enumerate(conv_list):
            conv_df = topic_df[topic_df['conversation'] == conv]
            avg_df = conv_df.groupby('turn')['opinion'].mean().reset_index()

            ax = axs_flat[i]
            ax.plot(avg_df['turn'], avg_df['opinion'], marker='o')
            ax.set_title(f"{conv}")
            ax.set_xlabel("Turn")
            ax.set_ylabel("Average Opinion")
            ax.set_ylim(-1, 1)
            ax.grid(True)

            # Optionally add category as text inside subplot
            category = conv_df['category'].iloc[0]
            ax.text(0.95, 0.05, category.replace('_', ' ').title(), transform=ax.transAxes,
                    fontsize=8, color='gray', ha='right', va='bottom')

        # Remove any unused subplots
        for j in range(i + 1, len(axs_flat)):
            fig.delaxes(axs_flat[j])

        # Add the topic as a big title above all subplots
        fig.suptitle(f"Average Opinion per Turn for Topic:\n{get_topic_category(topic)}", fontsize=16, y=1)

        plt.tight_layout()
        plt.subplots_adjust(top=0.9)  # adjust to make room for suptitle

        safe_topic = topic.replace(" ", "_").replace("/", "_").replace("?", "").replace(".", "")
        output_path = os.path.join(output_folder, f'average_opinion_per_turn_by_conversation_{safe_topic}.png')
        plt.savefig(output_path, bbox_inches='tight')
        plt.close()
        print(f"Saved average opinion per turn plot for topic '{topic}' to {output_path}")

def plot_average_opinion_per_turn_combined_all_conversations(csv_file, output_folder='plots'):
    df = pd.read_csv(csv_file)
    df['category'] = df['topic'].apply(get_topic_category)

    topics = sorted(df['topic'].unique())
    ensure_folder(output_folder)

    for topic in topics:
        topic_df = df[df['topic'] == topic]
        conv_list = sorted(topic_df['conversation'].unique())

        # Create color palette
        color_palette = sns.color_palette("husl", len(conv_list))
        color_map = dict(zip(conv_list, color_palette))

        plt.figure(figsize=(10, 6))

        for conv in conv_list:
            conv_df = topic_df[topic_df['conversation'] == conv]
            avg_df = conv_df.groupby('turn')['opinion'].mean().reset_index()

            plt.plot(
                avg_df['turn'],
                avg_df['opinion'],
                marker='o',
                color=color_map[conv],
                label=conv,
                linewidth=2,
                alpha=0.8
            )

        category = topic_df['category'].iloc[0]
        plt.title(
            f"Average Opinion per Turn by Conversation\n ({category.replace('_', ' ').title()})",
            fontsize=14,
            fontweight='bold'
        )
        plt.xlabel("Turn")
        plt.ylabel("Average Opinion")
        plt.ylim(-1, 1)
        plt.grid(True, linestyle='--', alpha=0.5)
        plt.legend(title="Conversation", fontsize='small', loc='best')

        plt.tight_layout()
        safe_topic = topic.replace(" ", "_").replace("/", "_").replace("?", "").replace(".", "")
        output_path = os.path.join(output_folder, f'average_opinion_per_turn_combined_{safe_topic}.png')
        plt.savefig(output_path, bbox_inches='tight')
        plt.close()

        print(f"✅ Saved combined average opinion per turn plot for topic '{topic}' to {output_path}")

def plot_average_delta_per_character_grouped_bar(csv_file, output_folder='plots'):
    import numpy as np

    df = pd.read_csv(csv_file)
    df['initials'] = df['character'].apply(get_initials)
    df['label'] = df['initials'] + " (" + df['personality'] + ")"
    df['category'] = df['topic'].apply(get_topic_category)

    # Filter turns 1 and 6
    df_filtered = df[df['turn'].isin([1, 6])]

    # Pivot: index = (label, conversation, category), columns = turn, values = opinion
    pivot = df_filtered.pivot_table(index=['label', 'conversation', 'category'], columns='turn', values='opinion')
    pivot = pivot.dropna(subset=[1, 6])
    pivot['delta'] = (pivot[6] - pivot[1]).abs()

    # Average delta per character and category
    avg_delta = pivot.reset_index().groupby(['label', 'category'])['delta'].mean().unstack(fill_value=0)

    characters = avg_delta.index.tolist()
    categories = avg_delta.columns.tolist()

    # Plot setup
    n_chars = len(characters)
    n_cats = len(categories)
    x = np.arange(n_chars)  # label locations
    width = 0.8 / n_cats  # bar width adjusted to number of categories

    fig, ax = plt.subplots(figsize=(max(10, n_chars * 0.5), 6))

    for i, category in enumerate(categories):
        offsets = x - 0.4 + i * width + width / 2
        ax.bar(offsets, avg_delta[category], width=width, label=category.replace('_', ' ').title())

    ax.set_xticks(x)
    ax.set_xticklabels(characters, rotation=45, ha='right')
    ax.set_ylim(0, 2)  # max delta = 2 since opinions between -1 and 1
    ax.set_ylabel('Average Opinion Delta (|Turn 6 - Turn 1|)')
    ax.set_xlabel('Character (Initials and Personality)')
    ax.set_title('Average Opinion Delta per Character by Topic Category')
    ax.legend(title='Topic Category', bbox_to_anchor=(1.05, 1), loc='upper left')
    ax.grid(axis='y')

    plt.tight_layout()
    ensure_folder(output_folder)
    output_path = os.path.join(output_folder, 'average_opinion_delta_per_character_grouped_bar_by_category.png')
    plt.savefig(output_path, bbox_inches='tight')
    plt.close()
    print(f"Saved grouped bar chart of average opinion delta per character by topic category to {output_path}")

def plot_flexibility_distribution(csv_file, output_folder='plots'):
    df = pd.read_csv(csv_file)
    
    # Build reverse lookup: personality → flexibility level
    personality_to_flex = {}
    for flex, plist in flexibility_groups.items():
        for p in plist:
            personality_to_flex[p] = flex

    # Filter first turn only to avoid double counting per conversation
    df_first_turn = df[df['turn'] == 0].copy()
    df_first_turn['flexibility'] = df_first_turn['personality'].map(personality_to_flex)

    # Count number of agents per flexibility level per conversation
    count_df = df_first_turn.groupby(['conversation', 'flexibility'])['character'].nunique().unstack(fill_value=0)

    # Sort by conversation number and relabel
    sorted_convs = sorted(count_df.index, key=lambda x: int(x.split('_')[1]))
    labeled_convs = [f"C-{int(c.split('_')[1])}" for c in sorted_convs]
    count_df = count_df.loc[sorted_convs]
    count_df.index = labeled_convs  # relabel index

    # Plot
    count_df.plot(kind='bar', stacked=True, colormap='tab20', figsize=(12, 6))

    plt.title('Distribution of Flexibility Bias Across Simulations')
    plt.ylabel('Number of Agents')
    plt.xlabel('Conversation')
    plt.xticks(rotation=45, ha='right')
    plt.legend(title='Flexibility Bias', bbox_to_anchor=(1.05, 1), loc='upper left')
    plt.tight_layout()

    ensure_folder(output_folder)
    output_path = os.path.join(output_folder, 'flexibility_distribution_per_simulation.png')
    plt.savefig(output_path, bbox_inches='tight')
    plt.close()
    print(f"Saved flexibility bias distribution graph to {output_path}")

def plot_category_win_matrix(csv_file, output_folder='plots'):

    # Load data
    df = pd.read_csv(csv_file)

    # Map personality to category
    flexibility_groups = {
        "Highly Rigid": ["INTJ", "ENTJ", "ISTJ", "ESTJ"],
        "Moderately Rigid": ["ENFJ", "ISFJ", "ISTP", "ESTP"],
        "Moderately Flexible": ["INFJ", "INTP", "ESFJ", "ISFP"],
        "Highly Flexible": ["ENFP", "ENTP", "INFP", "ESFP"]
    }
    personality_to_category = {}
    for category, personalities in flexibility_groups.items():
        for p in personalities:
            personality_to_category[p] = category

    df['category'] = df['personality'].map(personality_to_category)

    # Filter for turn 0 and turn 6 only
    df_filtered = df[df['turn'].isin([0, 6])]

    # Calculate absolute opinion delta per conversation, character
    pivot = df_filtered.pivot_table(index=['conversation', 'character', 'category'], columns='turn', values='opinion')
    pivot = pivot.dropna(subset=[0, 6])
    pivot['delta'] = (pivot[6] - pivot[0]).abs()
    pivot = pivot.reset_index()

    characters = pivot['character'].unique()
    char_category_map = pivot.set_index('character')['category'].to_dict()

    # Create character vs character win matrix (counts)
    win_matrix = pd.DataFrame(0, index=characters, columns=characters)

    for conv in pivot['conversation'].unique():
        conv_df = pivot[pivot['conversation'] == conv]
        for i, row_i in conv_df.iterrows():
            for j, row_j in conv_df.iterrows():
                if row_i['character'] != row_j['character']:
                    if row_i['delta'] < row_j['delta']:
                        win_matrix.loc[row_i['character'], row_j['character']] += 1

    # Aggregate wins by category (counts)
    categories = list(flexibility_groups.keys())
    category_win_matrix = pd.DataFrame(0, index=categories, columns=categories)

    for i in characters:
        for j in characters:
            cat_i = char_category_map.get(i)
            cat_j = char_category_map.get(j)
            if cat_i and cat_j:
                category_win_matrix.loc[cat_i, cat_j] += win_matrix.loc[i, j]

    # Plot raw counts heatmap (integers)
    plt.figure(figsize=(10, 8))
    sns.heatmap(category_win_matrix, annot=True, fmt="d", cmap="Blues")
    plt.title("Category vs Category Win Counts\n(Win = Lower Opinion Delta from Turn 0 to Turn 6)")
    plt.ylabel("Winner Category")
    plt.xlabel("Loser Category")
    plt.tight_layout()
    counts_output_path = os.path.join(output_folder, 'category_win_counts_matrix.png')
    plt.savefig(counts_output_path)
    plt.close()
    print(f"Saved category win counts matrix heatmap to {counts_output_path}")

def plot_average_opinion_per_turn_by_topic_overall(csv_file, output_folder='plots'):
    """
    Plots a single combined line graph showing the average opinion per turn,
    averaged over all conversations, for each topic.

    Each topic appears as one line.
    """
    df = pd.read_csv(csv_file)
    df['category'] = df['topic'].apply(get_topic_category)

    ensure_folder(output_folder)

    # Compute average opinion per turn per topic
    avg_by_topic = (
        df.groupby(['topic', 'turn'])['opinion']
        .mean()
        .reset_index()
    )

    topics = sorted(df['topic'].unique())
    plt.figure(figsize=(10, 6))

    for topic in topics:
        topic_df = avg_by_topic[avg_by_topic['topic'] == topic]
        plt.plot(
            topic_df['turn'],
            topic_df['opinion'],
            marker='o',
            label=f"{get_topic_category(topic).replace('_', ' ').title()}"
        )

    plt.title("Average Opinion per Turn (Averaged Across All Conversations)")
    plt.xlabel("Turn")
    plt.ylabel("Average Opinion")
    plt.ylim(-1, 1)
    plt.grid(True)
    plt.legend(title="Topic Category", bbox_to_anchor=(1.05, 1), loc='upper left')
    plt.tight_layout()

    output_path = os.path.join(output_folder, 'average_opinion_per_turn_by_topic_overall.png')
    plt.savefig(output_path, bbox_inches='tight')
    plt.close()
    print(f"Saved overall average opinion per turn plot to {output_path}")


# ==== MAIN ====

if __name__ == "__main__":
    CSV_FILE = "opinion_chart_data_with_info.csv"
    OUTPUT_FOLDER = "plots"

    print("Generating cumulative character participation graph...")
    plot_character_participation(CSV_FILE, OUTPUT_FOLDER)

    print("Generating cumulative opinion delta heatmap...")
    plot_opinion_delta_heatmap(CSV_FILE, OUTPUT_FOLDER)

    print("Generating combined category-subgrouped character participation graph...")
    plot_character_participation_combined(CSV_FILE, OUTPUT_FOLDER)

    print("Generating combined category-subgrouped opinion delta heatmap...")
    plot_opinion_delta_heatmap_combined(CSV_FILE, OUTPUT_FOLDER)

    print("Generating combined turn 0 vs turn 6 line graphs by category...")
    plot_turn0_turn6_by_topic_combined(CSV_FILE, OUTPUT_FOLDER)
    
    print("Generating turn 0 vs turn 6 line graphs by topic...")
    plot_turn0_turn6_by_topic(CSV_FILE, OUTPUT_FOLDER)

    print("Generating combined average opinion per turn by conversation plot...")
    plot_average_opinion_per_turn_by_conversation_combined(CSV_FILE, OUTPUT_FOLDER)

    print("Generating average delta per character per topic bar chart...")
    plot_average_delta_per_character_grouped_bar(CSV_FILE, OUTPUT_FOLDER)

    print("Generating flexibility distribution graph...")
    plot_flexibility_distribution(CSV_FILE, OUTPUT_FOLDER)
    
    print("Generating category win rate matrix heatmap...")
    plot_category_win_matrix(CSV_FILE, OUTPUT_FOLDER)
    
    print("Generating overall average opinion per turn by topic plot...")
    plot_average_opinion_per_turn_by_topic_overall(CSV_FILE, OUTPUT_FOLDER)
    
    print("Generating overall opinion combination per turn by topic plot...")
    plot_average_opinion_per_turn_combined_all_conversations(CSV_FILE, OUTPUT_FOLDER)
